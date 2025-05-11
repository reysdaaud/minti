// src/components/library/PlayerBar.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { Play, Pause, PlusCircle, LaptopMinimal, Heart } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';

const PlayerBar: FC = () => {
  const { currentTrack, isPlaying, togglePlayPause, setIsPlayerOpen } = usePlayer();

  if (!currentTrack) {
    return null; // Don't render PlayerBar if no track is selected
  }

  const handlePlayerBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent opening player if a control button inside playerbar was clicked
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    // setIsPlayerOpen(true); // This will be for Phase 2
    console.log("PlayerBar clicked, will open full player in Phase 2");
  };

  return (
    <div 
      className="fixed bottom-[60px] md:bottom-0 left-0 right-0 bg-[#B92929] text-white p-3 flex items-center justify-between shadow-lg md:mr-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)] group-data-[collapsible=icon]:md:mr-0 cursor-pointer"
      onClick={handlePlayerBarClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handlePlayerBarClick(e)}
      aria-label="Open audio player"
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="relative w-10 h-10 rounded-sm overflow-hidden flex-shrink-0">
          <Image
            src={currentTrack.imageUrl}
            alt={`${currentTrack.title} album art`}
            layout="fill"
            objectFit="cover"
            data-ai-hint={currentTrack.dataAiHint || "album art"}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{currentTrack.title}</p>
          {currentTrack.artist && <p className="text-xs text-neutral-300 truncate">{currentTrack.artist}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4 ml-2">
        <button className="text-white hover:text-neutral-300 transition-colors hidden md:block" aria-label="Like song" onClick={(e) => e.stopPropagation()}>
           <Heart className="w-5 h-5" />
        </button>
        <button className="text-white hover:text-neutral-300 transition-colors" aria-label="Devices available" onClick={(e) => e.stopPropagation()}>
          <LaptopMinimal className="w-5 h-5" />
        </button>
        <button className="text-white hover:text-neutral-300 transition-colors md:hidden" aria-label="Add to playlist" onClick={(e) => e.stopPropagation()}>
          <PlusCircle className="w-5 h-5" />
        </button>
        <button 
          className="text-white hover:text-neutral-300 transition-colors" 
          aria-label={isPlaying ? "Pause song" : "Play song"}
          onClick={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
        </button>
      </div>
    </div>
  );
};

export default PlayerBar;