'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface CardItem {
  id: string;
  title: string;
  imageUrl: string;
  dataAiHint: string;
}

interface SectionProps {
  title: string;
  items: CardItem[];
}

const LibraryCard: FC<CardItem> = ({ title, imageUrl, dataAiHint }) => {
  return (
    <div className="min-w-[140px] md:min-w-[160px] flex-shrink-0 snap-start group">
      <div className="relative w-full h-[140px] md:h-[160px] bg-neutral-700 overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={dataAiHint}
        />
      </div>
      <p className="mt-2 text-sm font-medium text-foreground truncate group-hover:text-primary">
        {title}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        Show &middot; Artist Name
      </p>
    </div>
  );
};

const LibrarySection: FC<SectionProps> = ({ title, items }) => {
  return (
    <section className="py-4">
      <h2 className="text-xl font-bold text-foreground mb-3 px-4 md:px-0">{title}</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 pb-4 px-4 md:px-0">
          {items.map((item) => (
            <LibraryCard key={item.id} {...item} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

const LibraryContent: FC = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Music', 'Podcasts'];

  const mixes: CardItem[] = [
    { id: 'mix1', title: 'POWER Tv Series', imageUrl: 'https://picsum.photos/seed/power/300/300', dataAiHint: 'tv series' },
    { id: 'mix2', title: 'The Weeknd Radio', imageUrl: 'https://picsum.photos/seed/weeknd/300/300', dataAiHint: 'music artist' },
    { id: 'mix3', title: 'Burna Boy Mix', imageUrl: 'https://picsum.photos/seed/burna/300/300', dataAiHint: 'afro beats' },
    { id: 'mix4', title: 'Bridget Blue Hits', imageUrl: 'https://picsum.photos/seed/bridget/300/300', dataAiHint: 'pop music' },
    { id: 'mix5', title: 'Starboy Deep Cuts', imageUrl: 'https://picsum.photos/seed/starboy/300/300', dataAiHint: 'rnb soul' },
  ];

  const artistsYouLike: CardItem[] = [
    { id: 'artist1', title: 'Diamond Platnumz', imageUrl: 'https://picsum.photos/seed/diamond/300/300', dataAiHint: 'african music' },
    { id: 'artist2', title: 'Taylor Swift', imageUrl: 'https://picsum.photos/seed/taylor/300/300', dataAiHint: 'country pop' },
    { id: 'artist3', title: 'Drake Essentials', imageUrl: 'https://picsum.photos/seed/drake/300/300', dataAiHint: 'hip hop' },
  ];

  const madeForYou: CardItem[] = [
    { id: 'made1', title: 'Pop Hits Rewind', imageUrl: 'https://picsum.photos/seed/pophits/300/300', dataAiHint: 'pop playlist' },
    { id: 'made2', title: 'Classic Vibes', imageUrl: 'https://picsum.photos/seed/classicvibes/300/300', dataAiHint: 'oldies playlist' },
    { id: 'made3', title: 'Chill Morning', imageUrl: 'https://picsum.photos/seed/chillmorning/300/300', dataAiHint: 'lofi beats' },
  ];


  // TODO: Filter content based on activeFilter
  const displayedContent = {
    mixes,
    artistsYouLike,
    madeForYou,
  };

  return (
    <div className="text-foreground">
      <ScrollArea className="w-full whitespace-nowrap px-4 md:px-0 py-3">
        <div className="flex space-x-2.5">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant="ghost"
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-4 py-1.5 font-semibold transition-colors duration-300 h-auto
                ${activeFilter === filter
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-neutral-700 text-white hover:bg-neutral-600'
                }`}
            >
              {filter}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <LibrarySection title="Your Mixes" items={displayedContent.mixes} />
      <LibrarySection title="Artists You Might Like" items={displayedContent.artistsYouLike} />
      <LibrarySection title="Made For You" items={displayedContent.madeForYou} />
    </div>
  );
};

// Export useState for use in the component
import { useState } from 'react';
export default LibraryContent;
