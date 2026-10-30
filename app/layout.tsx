import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Signal Garden — A little mystery. Better together.', description: 'A free multiplayer deduction game for 2–8 friends. Share clues through glowing beacons, discover hidden flowers, and grow a garden together. No accounts needed.', icons: { icon: '/favicon.svg' }, openGraph: { title: 'Signal Garden', description: 'Different clues. One shared discovery. Play with 2–8 friends.', type: 'website' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
