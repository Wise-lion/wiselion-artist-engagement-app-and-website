// BingoScreen — live bingo with the Wiselion avatar hosting.
//
// Socket flow:
//   join_game → receive `new_number` → store number + avatar.callNumber()
//              (avatar talks, audio plays, cards auto-daub)
//   tap BINGO! → emit `claim_bingo` → server validates → `bingo_win`
//              → avatar.celebrate() + confetti
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Dimensions, Alert } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useRoute } from '@react-navigation/native';
import { Screen, Title, Body, Button, Card } from '../../components/ui';
import { WiselionAvatar } from '../../components/WiselionAvatar';
import { BingoCard } from '../../components/BingoCard';
import { useWiselionHost } from '../../hooks/useWiselionHost';
import { useBingoStore } from '../../store/useBingoStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Endpoints } from '../../services/api';
import { connectSocket } from '../../services/socket';
import { theme } from '../../config';

const { width } = Dimensions.get('window');

export default function BingoScreen() {
  const { gameId } = useRoute<any>().params;
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const { drawnNumbers, lastNumber, myCards, setGame, setMyCards, addNumber, reset } = useBingoStore();
  const avatar = useWiselionHost();
  const [game, setGameInfo] = useState<any>(null);
  const [buying, setBuying] = useState(false);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const g = await Endpoints.game(gameId);
      setGameInfo(g);
      setGame(gameId, g.numbersDrawn || []);
      setMyCards(await Endpoints.myCards(gameId));

      const socket = await connectSocket();
      socketRef.current = socket;
      socket.emit('join_game', gameId);

      // A number was drawn → daub + avatar calls it.
      socket.on('new_number', ({ number, drawType }: { number: number; drawType: 'bingo' }) => {
        addNumber(number);
        avatar.callNumber(number, drawType);
      });

      // Someone (maybe us) won → celebrate.
      socket.on('bingo_win', ({ winnerId, winnerName }: any) => {
        avatar.celebrate(winnerName);
        if (winnerId === profile?.id) {
          refreshProfile(); // prize coins credited
          Alert.alert('🎉 BINGO!', 'You won! Coins added to your wallet.');
        }
      });

      socket.on('claim_rejected', ({ reason }: any) => Alert.alert('Not yet!', reason));
    })();

    return () => {
      socketRef.current?.off('new_number');
      socketRef.current?.off('bingo_win');
      socketRef.current?.off('claim_rejected');
      socketRef.current?.emit('leave_game', gameId);
      reset();
    };
  }, [gameId]);

  const buyCard = async () => {
    setBuying(true);
    try {
      await Endpoints.buyCard(gameId);
      setMyCards(await Endpoints.myCards(gameId));
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('Could not buy card', e.message);
    } finally {
      setBuying(false);
    }
  };

  const claimBingo = () => socketRef.current?.emit('claim_bingo', { gameId });

  return (
    <Screen style={{ padding: 0 }}>
      {/* Avatar host header */}
      <View style={{ alignItems: 'center', paddingVertical: 16, backgroundColor: theme.card }}>
        <WiselionAvatar state={avatar.state} caption={avatar.caption} size={160} />
        <Title style={{ marginTop: 18 }}>{game?.title || 'Bingo'}</Title>
        <Body>Last number: {lastNumber ?? '—'} · {drawnNumbers.length} drawn</Body>
        <Body>Balance: {profile?.coinBalance ?? 0} 🪙</Body>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Recently drawn numbers strip */}
        <Card style={{ marginBottom: 12 }}>
          <Body style={{ marginBottom: 6 }}>Drawn</Body>
          <Body style={{ color: theme.goldLight, fontSize: 16 }}>
            {drawnNumbers.slice(-15).join('  ') || 'Waiting for the first number…'}
          </Body>
        </Card>

        {myCards.length === 0 ? (
          <Body>You have no cards yet.</Body>
        ) : (
          myCards.map((pc) => (
            <BingoCard key={pc.id} grid={pc.grid} drawnNumbers={drawnNumbers} isWinner={pc.isWinner} />
          ))
        )}

        <Button
          title={`Buy Card (${game?.ticketPrice ?? '…'} 🪙)`}
          loading={buying}
          onPress={buyCard}
        />
        <Button variant="ghost" title="BINGO!  🎉" onPress={claimBingo} disabled={myCards.length === 0} />
      </ScrollView>

      {avatar.confetti && (
        <ConfettiCannon count={150} origin={{ x: width / 2, y: 0 }} fadeOut autoStart />
      )}
    </Screen>
  );
}
