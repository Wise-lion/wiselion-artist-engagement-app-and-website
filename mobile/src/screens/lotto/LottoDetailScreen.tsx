// LottoDetailScreen — buy tickets and watch the Wiselion avatar announce the winner.
//
// On `lotto_winner`: avatar plays "drawing" suspense, then celebrates + confetti.
import React, { useEffect, useRef, useState } from 'react';
import { View, Dimensions, Alert } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useRoute } from '@react-navigation/native';
import { Screen, Title, Body, Button, Card } from '../../components/ui';
import { WiselionAvatar } from '../../components/WiselionAvatar';
import { PrizePotCard } from '../../components/PrizePotCard';
import { useWiselionHost } from '../../hooks/useWiselionHost';
import { useAuthStore } from '../../store/useAuthStore';
import { Endpoints } from '../../services/api';
import { connectSocket } from '../../services/socket';
import { theme } from '../../config';

const { width } = Dimensions.get('window');

export default function LottoDetailScreen() {
  const { drawId } = useRoute<any>().params;
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const avatar = useWiselionHost();
  const [draw, setDraw] = useState<any>(null);
  const [status, setStatus] = useState<any>(null); // Prize Growth Engine pot
  const [buying, setBuying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const socketRef = useRef<any>(null);

  // Pull the live composed pot (base + AMM yield + house boost).
  const loadStatus = async () => {
    try {
      setStatus(await Endpoints.lottoStatus());
    } catch {
      setStatus(null); // no active round / endpoint unavailable → hide the card
    }
  };

  useEffect(() => {
    (async () => {
      setDraw(await Endpoints.lottoDraw(drawId));
      await loadStatus();
      const socket = await connectSocket();
      socketRef.current = socket;
      socket.emit('join_lotto', drawId);

      socket.on('lotto_winner', (payload: any) => {
        // Suspense first, then the avatar reveals the winner.
        avatar.playDrawingSound();
        setTimeout(() => {
          avatar.celebrate(payload.winnerName);
          setResult(payload);
          if (payload.winnerId === profile?.id) {
            refreshProfile();
            Alert.alert('🎉 You won the Lotto!', `Ticket ${payload.ticketNumber} · +${payload.prize} 🪙`);
          }
        }, 2500);
      });
    })();

    // Poll the pot every 30s so AMM yield / house boosts animate in live.
    const poll = setInterval(loadStatus, 30000);

    return () => {
      socketRef.current?.off('lotto_winner');
      clearInterval(poll);
    };
  }, [drawId]);

  const buyTicket = async () => {
    setBuying(true);
    try {
      const t = await Endpoints.buyTicket(drawId);
      await refreshProfile();
      setDraw(await Endpoints.lottoDraw(drawId));
      Alert.alert('Ticket purchased', `Your ticket: ${t.number}`);
    } catch (e: any) {
      Alert.alert('Could not buy ticket', e.message);
    } finally {
      setBuying(false);
    }
  };

  if (!draw) return <Screen><Body>Loading…</Body></Screen>;

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <WiselionAvatar state={avatar.state} caption={avatar.caption} size={170} />
      </View>

      <Title style={{ marginTop: 12, marginBottom: 12 }}>{draw.title}</Title>

      {/* Prize Growth Engine pot (XRP). Falls back to the coin pool if no
          active on-chain round is returned by /lotto/status. */}
      {status ? (
        <PrizePotCard
          pot={status.displayPot}
          tag={status.tag}
          isRollover={status.isRollover}
          drawTime={status.drawTime}
        />
      ) : (
        <Card>
          <Body>Prize pool</Body>
          <Title style={{ color: theme.goldLight }}>{draw.prize.toLocaleString()} 🪙</Title>
        </Card>
      )}

      <Card style={{ marginTop: 12 }}>
        <Body>Ticket price: {draw.ticketPrice} 🪙</Body>
        <Body>Your tickets: {draw.myTicketCount ?? 0}</Body>
        <Body style={{ marginTop: 4 }}>Draw: {new Date(draw.drawDate).toLocaleString()}</Body>
      </Card>

      {result && (
        <Card style={{ marginTop: 12, borderColor: theme.goldLight, borderWidth: 1 }}>
          <Title style={{ fontSize: 16 }}>🏆 Winner</Title>
          <Body style={{ color: theme.goldLight }}>
            {result.winnerName} · {result.ticketNumber}
          </Body>
        </Card>
      )}

      <Button
        title={`Buy Ticket (${draw.ticketPrice} 🪙)`}
        loading={buying}
        onPress={buyTicket}
        style={{ marginTop: 16 }}
      />

      {avatar.confetti && <ConfettiCannon count={180} origin={{ x: width / 2, y: 0 }} fadeOut autoStart />}
    </Screen>
  );
}
