// src/components/library/TopListItemCard.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { MoreHorizontal } from 'lucide-react';

interface TopListItemCardProps {
  title: string;
  imageUrl: string;
  dataAiHint: string;
  hasMoreOptions?: boolean;
}

const TopListItemCard: FC<TopListItemCardProps> = ({ title, imageUrl, dataAiHint, hasMoreOptions }) => {
  return (
    <div className="bg-neutral-800 hover:bg-neutral-700/80 transition-colors rounded-md flex items-center space-x-3 cursor-pointer shadow-sm">
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
      </div>
      {hasMoreOptions && (
        <button className="p-2 text-muted-foreground hover:text-primary mr-1">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default TopListItemCard;
