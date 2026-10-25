import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StoryMaker — Multi-Speaker Studio',
  description: 'AI Multi-Character Audio Synthesizer with ElevenLabs & Supabase',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-bg text-[#eef1fb]">{children}</body>
    </html>
  );
}