// =============================================================================
// chain.ts — XRPL Prize Growth Engine (AMM yield), corrected & schema-aligned
// -----------------------------------------------------------------------------
// FIXES vs the first draft:
//   1. LP token issuer = the AMM ACCOUNT (from amm_info.amm.lp_token), never the
//      hot wallet. This was the #1 reason withdraws failed.
//   2. LP currency is resolved live from amm_info — never hardcoded.
//   3. Correct flags via AMMDepositFlags / AMMWithdrawFlags enums (tfSingleAsset
//      is 0x00080000, NOT 0x00010000 which is tfLPToken).
//   4. Withdraw uses tfOneAssetWithdrawAll → burns ALL our LP, returns pure XRP,
//      so no LPTokenIn currency/issuer juggling and the pot stays XRP for payout.
//   5. Yield measured by XRP balance delta ACROSS the withdraw + fee add-back,
//      not a global wallet-balance subtraction.
//   6. No phantom "convert 50% via OfferCreate" — single-sided deposit handles
//      the rebalance internally.
//
// FINANCIAL MODEL: idle pot → single-sided XRP deposit into XRP/USDC AMM → accrues
// a pro-rata share of swap fees → harvested before the draw as XRP. Surplus over
// principal is `amm_yield_earned_xrp`.
// =============================================================================

import {
  Client,
  Wallet,
  xrpToDrops,
  dropsToXrp,
  AMMDepositFlags,
  AMMWithdrawFlags,
  type AMMDeposit,
  type AMMWithdraw,
} from 'xrpl';
import { prisma } from '../lib/prisma'; // reuse the app's Prisma client

const USD_CURRENCY = {
  currency: 'USD',
  issuer: process.env.XRPL_USDC_ISSUER || 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq',
} as const;
const XRP_ASSET = { currency: 'XRP' } as const;

// Refuse to deploy into a pool thinner than this (XRP) — single-sided deposits
// into shallow pools suffer punishing slippage.
const MIN_POOL_XRP = Number(process.env.XRPL_MIN_POOL_XRP || 25_000);
// Accept at least this fraction of principal back on withdraw (slippage floor).
const WITHDRAW_SLIPPAGE = Number(process.env.XRPL_WITHDRAW_SLIPPAGE || 0.97);

interface AmmRef {
  ammAccount: string; // issuer of the LP token
  xrpReserve: number;
}

export class XRPLPrizePool {
  private client: Client;
  private hotWallet: Wallet;

  constructor() {
    this.client = new Client(process.env.XRPL_RPC_URL || 'wss://s.altnet.rippletest.net:51233');
    this.hotWallet = Wallet.fromSeed(process.env.XRPL_HOT_WALLET_SEED!);
  }

  private async ensureConnected(): Promise<void> {
    if (!this.client.isConnected()) await this.client.connect();
  }

  /** Resolve the live AMM for XRP/USDC. Throws if it doesn't exist or is too thin. */
  private async resolveAmm(): Promise<AmmRef> {
    const info = await this.client.request({
      command: 'amm_info',
      asset: XRP_ASSET,
      asset2: USD_CURRENCY,
    });
    const amm = info.result.amm;
    const xrpReserve = Number(dropsToXrp(amm.amount as string));
    return { ammAccount: amm.account, xrpReserve };
  }

  /** Our LP-token balance for this specific AMM (issuer = the AMM account). */
  private async getLpBalance(ammAccount: string): Promise<string> {
    const lines = await this.client.request({
      command: 'account_lines',
      account: this.hotWallet.address,
      peer: ammAccount, // filter to lines issued by the AMM → the LP token
    });
    const lp = lines.result.lines.find((l) => l.account === ammAccount);
    return lp ? lp.balance : '0';
  }

  private static txCode(meta: unknown): string | undefined {
    return meta && typeof meta === 'object' ? (meta as any).TransactionResult : undefined;
  }

  // ---- ENGINE 2a: deploy --------------------------------------------------
  /**
   * Single-sided deposit (XRP only) of the round's pot into the XRP/USDC AMM.
   * Persists the LP balance + DEPLOYED status. On low liquidity / missing pool,
   * marks FAILED and holds XRP instead (no harvest attempted later).
   */
  async deployPotToAMM(roundId: string, potAmountXRP: number): Promise<string> {
    if (potAmountXRP <= 0) throw new Error('potAmountXRP must be > 0');
    await this.ensureConnected();

    let amm: AmmRef;
    try {
      amm = await this.resolveAmm();
      if (amm.xrpReserve < MIN_POOL_XRP) throw new Error('pool too thin');
    } catch {
      await this.markAMMFailed(roundId);
      return 'AMM_DEPOSIT_SKIPPED';
    }

    const tx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: this.hotWallet.address,
      Asset: XRP_ASSET,
      Asset2: USD_CURRENCY,
      Amount: xrpToDrops(potAmountXRP),
      Flags: AMMDepositFlags.tfSingleAsset, // contribute ONLY XRP, receive LP tokens
    };

    const prepared = await this.client.autofill(tx);
    const signed = this.hotWallet.sign(prepared);
    const res = await this.client.submitAndWait(signed.tx_blob);
    const code = XRPLPrizePool.txCode(res.result.meta);
    if (code !== 'tesSUCCESS') {
      await this.markAMMFailed(roundId);
      return 'AMM_DEPOSIT_SKIPPED';
    }

    const lpBalance = await this.getLpBalance(amm.ammAccount);
    await this.storeAMMState(roundId, lpBalance, potAmountXRP);
    return res.result.hash;
  }

  // ---- ENGINE 2b: harvest -------------------------------------------------
  /**
   * Burn ALL LP tokens (tfOneAssetWithdrawAll → receive XRP) and return the yield
   * (returned XRP − principal) to be added to amm_yield_earned_xrp.
   */
  async harvestPrizePool(roundId: string): Promise<number> {
    const { lpBalance, principalXrp, status } = await this.getRoundAmm(roundId);
    if (status !== 'DEPLOYED' || !lpBalance || lpBalance === '0') return 0;

    await this.ensureConnected();
    const amm = await this.resolveAmm();

    const xrpBefore = Number(await this.client.getXrpBalance(this.hotWallet.address));
    const minOut = Math.max(0, Math.floor(principalXrp * WITHDRAW_SLIPPAGE));

    const tx: AMMWithdraw = {
      TransactionType: 'AMMWithdraw',
      Account: this.hotWallet.address,
      Asset: XRP_ASSET,
      Asset2: USD_CURRENCY,
      Amount: xrpToDrops(minOut), // slippage floor: minimum XRP we accept
      Flags: AMMWithdrawFlags.tfOneAssetWithdrawAll, // redeem all LP → XRP only
    };

    const prepared = await this.client.autofill(tx);
    const feeXrp = Number(dropsToXrp((prepared.Fee as string) || '12'));
    const signed = this.hotWallet.sign(prepared);
    const res = await this.client.submitAndWait(signed.tx_blob);
    if (XRPLPrizePool.txCode(res.result.meta) !== 'tesSUCCESS') {
      // Don't interrupt the game — treat as zero yield, leave principal in place.
      console.error(`Harvest failed for ${roundId}: ${XRPLPrizePool.txCode(res.result.meta)}`);
      return 0;
    }

    const xrpAfter = Number(await this.client.getXrpBalance(this.hotWallet.address));
    // Gross returned = balance gained + the fee we burned doing the withdraw.
    const xrpReturned = Number((xrpAfter - xrpBefore + feeXrp).toFixed(6));
    const yieldXrp = Number(Math.max(0, xrpReturned - principalXrp).toFixed(6));

    await this.storeHarvestResult(roundId, yieldXrp);
    void amm;
    return yieldXrp;
  }

  // ---- DB helpers (mapped to your lotto_rounds columns) -------------------

  private async getRoundAmm(
    roundId: string
  ): Promise<{ lpBalance: string | null; principalXrp: number; status: string }> {
    const r = await prisma.lottoDraw.findUnique({
      where: { id: roundId },
      select: { ammLpBalance: true, initialPotXrp: true, ammStatus: true },
    });
    // initialPotXrp is treated as the deployed principal (100% deploy model).
    return {
      lpBalance: r?.ammLpBalance ?? null,
      principalXrp: Number(r?.initialPotXrp ?? 0),
      status: r?.ammStatus ?? 'PENDING',
    };
  }

  private async storeAMMState(roundId: string, lpBalance: string, _xrpDeposited: number) {
    await prisma.lottoDraw.update({
      where: { id: roundId },
      data: { ammLpBalance: lpBalance, ammStatus: 'DEPLOYED' },
    });
  }

  private async markAMMFailed(roundId: string) {
    await prisma.lottoDraw.update({ where: { id: roundId }, data: { ammStatus: 'FAILED' } });
  }

  private async storeHarvestResult(roundId: string, yieldXRP: number) {
    // Atomic increment so concurrent harvests/boosts never clobber the column.
    await prisma.lottoDraw.update({
      where: { id: roundId },
      data: { ammYieldEarnedXrp: { increment: yieldXRP }, ammStatus: 'HARVESTED' },
    });
  }

  async disconnect(): Promise<void> {
    if (this.client.isConnected()) await this.client.disconnect();
  }
}
