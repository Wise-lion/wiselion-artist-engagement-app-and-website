// Seed a few demo media items (songs, audio messages, a video with platform links).
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.mediaItem.deleteMany({});
  await prisma.mediaItem.createMany({
    data: [
      { kind: 'SONG', title: 'King of the Pride', artist: 'Wiselion', durationSec: 212, sortOrder: 1,
        url: 'https://cdn.wiselion.app/media/king-of-the-pride.mp3',
        artworkUrl: 'https://placehold.co/300x300/D4A026/0B1E3F?text=King+of+the+Pride' },
      { kind: 'SONG', title: 'Golden Roar', artist: 'Wiselion', durationSec: 187, sortOrder: 2,
        url: 'https://cdn.wiselion.app/media/golden-roar.mp3',
        artworkUrl: 'https://placehold.co/300x300/8C5A1E/F5F3EC?text=Golden+Roar' },
      { kind: 'AUDIO_MESSAGE', title: 'Welcome to the Pride', description: 'A message from the Wiselion King', durationSec: 48, sortOrder: 1,
        url: 'https://cdn.wiselion.app/media/welcome-message.mp3',
        artworkUrl: 'https://placehold.co/300x300/0B1E3F/F2C94C?text=Message' },
      { kind: 'AUDIO_MESSAGE', title: 'Jackpot Hype', description: 'Get ready for the weekly draw', durationSec: 33, sortOrder: 2, premiumOnly: true,
        url: 'https://cdn.wiselion.app/media/jackpot-hype.mp3',
        artworkUrl: 'https://placehold.co/300x300/D4A026/0B1E3F?text=Hype' },
      { kind: 'VIDEO', title: 'Wiselion Live — Highlights', description: 'Best moments from Friday night', durationSec: 0, sortOrder: 1,
        url: 'https://cdn.wiselion.app/media/highlights.mp4',
        artworkUrl: 'https://placehold.co/600x340/0B1E3F/F2C94C?text=Highlights',
        platformLinks: { youtube: 'https://youtube.com/@wiselion', instagram: 'https://instagram.com/wiselion', tiktok: 'https://tiktok.com/@wiselion' } },
      { kind: 'VIDEO', title: 'New Single — Official Video', description: 'Watch on your favorite platform', sortOrder: 2,
        artworkUrl: 'https://placehold.co/600x340/8C5A1E/F5F3EC?text=Official+Video',
        platformLinks: { youtube: 'https://youtube.com/@wiselion', spotify: 'https://open.spotify.com', apple: 'https://music.apple.com' } },
    ],
  });
  console.log('✅ Seeded media library');
}
main().finally(() => prisma.$disconnect());
