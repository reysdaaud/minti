// src/components/library/PlayerBar.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { Play, PlusCircle, LaptopMinimal, Heart } from 'lucide-react'; // Using Heart for like

const PlayerBar: FC = () => {
  // Placeholder data
  const currentTrack = {
    title: 'No Romeo No Juliet',
    artist: '50 Cent',
    albumArtUrl: 'https://picsum.photos/seed/noromeo/64/64', // Placeholder image
  };

  return (
    <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 bg-[#B92929] text-white p-3 flex items-center justify-between shadow-lg md:mr-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)] group-data-[collapsible=icon]:md:mr-0"> {/* Example color matching screenshot, adjust md:mr for sidebar */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="relative w-10 h-10 rounded-sm overflow-hidden flex-shrink-0">
          <Image
            src={currentTrack.albumArtUrl}
            alt={`${currentTrack.title} album art`}
            layout="fill"
            objectFit="cover"
            data-ai-hint="album art"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{currentTrack.title}</p>
          <p className="text-xs text-neutral-300 truncate">{currentTrack.artist}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4 ml-2">
        <button className="text-white hover:text-neutral-300 transition-colors hidden md:block" aria-label="Like song">
           <Heart className="w-5 h-5" />
        </button>
        <button className="text-white hover:text-neutral-300 transition-colors" aria-label="Devices available">
          <LaptopMinimal className="w-5 h-5" />
        </button>
        <button className="text-white hover:text-neutral-300 transition-colors" aria-label="Add to playlist">
          <PlusCircle className="w-5 h-5 md:hidden" /> {/* Show on mobile, hide on md per screenshot */}
        </button>
        <button className="text-white hover:text-neutral-300 transition-colors" aria-label="Play song">
          <Play className="w-6 h-6 fill-current" />
        </button>
      </div>
    </div>
  );
};

export default PlayerBar;
