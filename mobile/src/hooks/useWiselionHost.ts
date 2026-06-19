// useWiselionHost — drives the avatar state machine for bingo/lotto screens.
//
// Call `callNumber(n, type)` on a `new_number` event:
//   → state becomes 'talking', audio plays, then auto-returns to 'idle'.
// Call `celebrate()` on `bingo_win` / `lotto_winner`:
//   → state becomes 'cheering' for 5s + confetti flag true, then back to 'idle'.
// Call `playDrawingSound()` to play the lotto "drawing" suspense clip.
import { useCallback, useRef, useState } from 'react';
import { AvatarState } from '../components/WiselionAvatar';
import { useAvatarAudio, DrawType } from './useAvatarAudio';

const TALK_MS = 2500; // fallback return-to-idle if audio end isn't detected
const CHEER_MS = 5000; // celebration duration per spec

function bingoLetter(n: number): string {
  if (n <= 15) return 'B';
  if (n <= 30) return 'I';
  if (n <= 45) return 'N';
  if (n <= 60) return 'G';
  return 'O';
}

export function useWiselionHost() {
  const [state, setState] = useState<AvatarState>('idle');
  const [caption, setCaption] = useState<string | undefined>();
  const [confetti, setConfetti] = useState(false);
  const { playNumber, playClip } = useAvatarAudio();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const callNumber = useCallback(
    (number: number, drawType: DrawType) => {
      clearTimers();
      setCaption(drawType === 'bingo' ? `${bingoLetter(number)} ${number}` : `#${number}`);
      setState('talking');
      playNumber(number, drawType);
      // Return to idle after the call finishes.
      timers.current.push(setTimeout(() => setState('idle'), TALK_MS));
    },
    [playNumber]
  );

  const playDrawingSound = useCallback(() => {
    setState('talking');
    setCaption('Drawing…');
    playClip('drawing');
  }, [playClip]);

  const celebrate = useCallback(
    (winnerName?: string) => {
      clearTimers();
      setCaption(winnerName ? `${winnerName} WINS!` : 'WINNER!');
      setState('cheering');
      setConfetti(true);
      playClip('winner');
      timers.current.push(
        setTimeout(() => {
          setState('idle');
          setConfetti(false);
          setCaption(undefined);
        }, CHEER_MS)
      );
    },
    [playClip]
  );

  return { state, caption, confetti, callNumber, celebrate, playDrawingSound };
}
