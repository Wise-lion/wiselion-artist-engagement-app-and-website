// useAvatarAudio — plays the Wiselion avatar's pre-recorded number call from the
// CDN, falling back to on-device TTS (expo-speech) if the audio file is missing.
//
// File naming on the CDN (AVATAR_AUDIO_BASE_URL):
//   bingo:  bingo_1.mp3 ... bingo_75.mp3
//   lotto:  lotto_1.mp3 ... lotto_99.mp3
//   special: drawing.mp3, winner.mp3
import { useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { config } from '../config';

export type DrawType = 'bingo' | 'lotto';

// Bingo column letter for the spoken phrase, e.g. 42 → "N 42".
function bingoLetter(n: number): string {
  if (n <= 15) return 'B';
  if (n <= 30) return 'I';
  if (n <= 45) return 'N';
  if (n <= 60) return 'G';
  return 'O';
}

export function useAvatarAudio() {
  const soundRef = useRef<Audio.Sound | null>(null);

  // Configure the audio session once (play even in silent mode on iOS).
  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const unload = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
  }, []);

  // Play a specific named clip ('drawing' | 'winner').
  const playClip = useCallback(
    async (clip: string) => {
      try {
        await unload();
        const { sound } = await Audio.Sound.createAsync(
          { uri: `${config.avatarAudioBaseUrl}/${clip}.mp3` },
          { shouldPlay: true }
        );
        soundRef.current = sound;
      } catch {
        // ignore missing special clips
      }
    },
    [unload]
  );

  /**
   * Play the call for a drawn number. Resolves when audio starts (or TTS is
   * spoken). On any failure to load the remote file, falls back to TTS so the
   * avatar always "says" the number.
   */
  const playNumber = useCallback(
    async (number: number, drawType: DrawType) => {
      const file = `${drawType}_${number}.mp3`;
      const phrase =
        drawType === 'bingo' ? `${bingoLetter(number)}, ${number}` : `Number ${number}`;
      try {
        await unload();
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: `${config.avatarAudioBaseUrl}/${file}` },
          { shouldPlay: true }
        );
        if (!status.isLoaded) throw new Error('not loaded');
        soundRef.current = sound;
      } catch {
        // Fallback: synthesize the call on-device.
        Speech.speak(phrase, { rate: 0.95, pitch: 1.05 });
      }
    },
    [unload]
  );

  return { playNumber, playClip, unload };
}
