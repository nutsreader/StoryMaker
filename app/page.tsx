import React from 'react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#a354ff] to-[#685cff] flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-purple-500/20">
        ✦
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">
        StoryMaker Studio
      </h1>
      <p className="text-sm text-[#8f9bb5] max-w-md">
        Next.js + Tailwind engine is successfully running on Vercel! Handa na para sa ElevenLabs backend at Supabase integration.
      </p>
      <div className="mt-6 px-4 py-2 rounded-full border border-[#202a40] bg-[#11182a] text-xs text-[#4dd6a2] font-mono">
        ● Vercel Build Status: Ready
      </div>
    </main>
  );
}