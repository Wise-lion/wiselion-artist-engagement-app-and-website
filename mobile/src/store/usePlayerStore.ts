// Global audio player backed by expo-av. Holds a queue of tracks and a single
// module-level Sound instance so playback continues across screen navigation.
import { create } from 'zustand';
import { Audio, AVPlaybackStatus } from 'expo-av';

export interface Track {
  id: string;
  title: string;
  artist?: string;
  url: string;
  artworkUrl?: string;
  durationSec?: number;
}

interface PlayerState {
  queue: Track[];
  index: number;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  current: () => Track | null;
  playQueue: (queue: Track[], index: number) => Promise<void>;
  toggle: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  stop: () => Promise<void>;
}

let sound: Audio.Sound | null = null;

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Reflect playback progress + auto-advance on track end.
  const onStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    set({
      isPlaying: status.isPlaying,
      positionMs: status.positionMillis,
      durationMs: status.durationMillis ?? 0,
    });
    if (status.didJustFinish) get().next();
  };

  const load = async (index: number) => {
    const { queue } = get();
    const track = queue[index];
    if (!track) return;
    if (sound) {
      await sound.unloadAsync().catch(() => {});
      sound = null;
    }
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
    const { sound: s } = await Audio.Sound.createAsync(
      { uri: track.url },
      { shouldPlay: true },
      onStatus
    );
    sound = s;
    set({ index, isPlaying: true, positionMs: 0 });
  };

  return {
    queue: [],
    index: 0,
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
    current: () => get().queue[get().index] || null,

    playQueue: async (queue, index) => {
      set({ queue });
      await load(index);
    },
    toggle: async () => {
      if (!sound) return;
      const { isPlaying } = get();
      if (isPlaying) await sound.pauseAsync();
      else await sound.playAsync();
    },
    next: async () => {
      const { index, queue } = get();
      if (index + 1 < queue.length) await load(index + 1);
      else set({ isPlaying: false }); // end of queue
    },
    prev: async () => {
      const { index } = get();
      // Restart current track if >3s in, otherwise go to previous.
      if (get().positionMs > 3000 || index === 0) await load(index);
      else await load(index - 1);
    },
    seek: async (ms) => {
      if (sound) await sound.setPositionAsync(ms);
    },
    stop: async () => {
      if (sound) {
        await sound.unloadAsync().catch(() => {});
        sound = null;
      }
      set({ isPlaying: false, queue: [], positionMs: 0, durationMs: 0 });
    },
  };
});
