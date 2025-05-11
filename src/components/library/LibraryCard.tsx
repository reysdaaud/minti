// src/components/library/LibraryCard.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { usePlayer, type Track } from '@/contexts/PlayerContext';

interface LibraryCardProps extends Omit<Track, 'id' | 'audioSrc' | 'dataAiHint'> {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  audioSrc: string; // Ensure audioSrc is part of the props
  dataAiHint: string;
}

const LibraryCard: FC<LibraryCardProps> = ({ id, title, subtitle, imageUrl, audioSrc, dataAiHint }) => {
  const { setCurrentTrack } = usePlayer();

  const handlePlay = () => {
    setCurrentTrack({ id, title, artist: subtitle, imageUrl, audioSrc, dataAiHint });
  };

  return (
    <div 
      className="min-w-[140px] md:min-w-[160px] w-[140px] md:w-[160px] flex-shrink-0 snap-start group cursor-pointer"
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
    >
      <div className="relative w-full aspect-square bg-neutral-800 overflow-hidden rounded-md shadow-md hover:shadow-lg transition-shadow">
        <Image
          src={imageUrl}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={dataAiHint}
        />
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default LibraryCard;