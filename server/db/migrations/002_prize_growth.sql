-- =============================================================================
-- 002_prize_growth.sql — Prize Growth Engine fields + status view
-- -----------------------------------------------------------------------------
-- displayedPot (what the player sees) is composed of three additive parts:
--     initial_pot            base pot for the round. If this round rolled over
--                            from a prior unwon round, the carried funds are
--                            already folded INTO initial_pot at round creation.
--   + amm_yield_earned       surplus harvested from the XRPL AMM between draws
--   + ai_booster_injected    house-marketing XRP injected to beat stagnation
--   ----------------------
--   = displayed_pot
--
-- `rolled_over` is a flag the frontend uses to badge a round as a rollover
-- ("JACKPOT ROLLED OVER!"). It does NOT add to displayed_pot — the carried
-- amount lives inside initial_pot.
--
-- All XRP amounts use DECIMAL(20,6): XRP has exactly 6 decimal places (drops),
-- and 20 total digits comfortably exceeds the 100B max supply.
-- =============================================================================

ALTER TABLE lotto_rounds
  ADD COLUMN IF NOT EXISTS initial_pot          DECIMAL(20, 6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amm_yield_earned     DECIMAL(20, 6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_booster_injected  DECIMAL(20, 6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rolled_over          BOOLEAN        NOT NULL DEFAULT FALSE;

-- Defensive guards: the three pot components can never be negative.
ALTER TABLE lotto_rounds
  ADD CONSTRAINT chk_initial_pot_nonneg          CHECK (initial_pot >= 0),
  ADD CONSTRAINT chk_amm_yield_nonneg            CHECK (amm_yield_earned >= 0),
  ADD CONSTRAINT chk_ai_booster_nonneg           CHECK (ai_booster_injected >= 0);

-- -----------------------------------------------------------------------------
-- View backing GET /lotto/status. Centralises the displayed_pot math so the API
-- and any analytics read an identical, single source of truth.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW lotto_round_status AS
SELECT
  id,
  status,
  draw_date,
  initial_pot,
  amm_yield_earned,
  ai_booster_injected,
  (initial_pot + amm_yield_earned + ai_booster_injected) AS displayed_pot,
  rolled_over AS is_rolled_over
FROM lotto_rounds;
