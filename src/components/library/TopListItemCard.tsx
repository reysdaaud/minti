// src/components/library/TopListItemCard.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { MoreHorizontal } from 'lucide-react';
import { usePlayer, type Track } from '@/contexts/PlayerContext';

interface TopListItemCardProps extends Omit<Track, 'id' | 'audioSrc' | 'dataAiHint' | 'artist'> {
  id: string;
  title: string;
  imageUrl: string;
  audioSrc: string; // Ensure audioSrc is part of the props
  dataAiHint: string;
  hasMoreOptions?: boolean;
  artist?: string; // Added artist for consistency with Track type
}

const TopListItemCard: FC<TopListItemCardProps> = ({ id, title, imageUrl, audioSrc, dataAiHint, hasMoreOptions, artist }) => {
  const { setCurrentTrack } = usePlayer();

  const handlePlay = () => {
    setCurrentTrack({ id, title, imageUrl, audioSrc, artist, dataAiHint });
  };
  
  return (
    <div 
      className="bg-neutral-800 hover:bg-neutral-700/80 transition-colors rounded-md flex items-center space-x-3 cursor-pointer shadow-sm"
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
    >
      <div className="relative w-14 h-14 md:w-16 md:h-16 flex-shrink-0 rounded-l-md overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          layout="fill"
          objectFit="cover"
          data-ai-hint={dataAiHint}
        />
      </div>
      <div className="flex-grow py-2 pr-2 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{title}</p>
         {artist && <p className="text-xs text-muted-foreground truncate">{artist}</p>}
      </div>
      {hasMoreOptions && (
        <button 
          className="p-2 text-muted-foreground hover:text-primary mr-1"
          onClick={(e) => {
            e.stopPropagation(); // Prevent playing when clicking more options
            console.log('More options clicked for:', title);
          }}
          aria-label="More options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default TopListItemCard;