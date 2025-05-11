// src/components/library/LibraryCard.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react'; // Optional: for a play button overlay

interface LibraryCardProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  dataAiHint: string;
}

const LibraryCard: FC<LibraryCardProps> = ({ title, subtitle, imageUrl, dataAiHint }) => {
  return (
    <div className="min-w-[140px] md:min-w-[160px] w-[140px] md:w-[160px] flex-shrink-0 snap-start group cursor-pointer">
      <div className="relative w-full aspect-square bg-neutral-800 overflow-hidden rounded-md shadow-md hover:shadow-lg transition-shadow">
        <Image
          src={imageUrl}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={dataAiHint}
        />
        {/* Optional: Play button overlay 
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <PlayCircle className="w-12 h-12 text-white/80" />
        </div>
        */}
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
