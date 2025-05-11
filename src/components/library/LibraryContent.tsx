// src/components/library/LibraryContent.tsx
'use client';

import type { FC } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import LibraryCard from './LibraryCard';
import TopListItemCard from './TopListItemCard';

interface CardItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  dataAiHint: string;
}

interface TopListItemData {
  id: string;
  title: string;
  imageUrl: string;
  dataAiHint: string;
  hasMoreOptions?: boolean;
}

interface SectionProps {
  title: string;
  items: CardItem[];
  itemType: 'default'; // For now, only one type of card in sections
}

const LibrarySection: FC<SectionProps> = ({ title, items }) => {
  return (
    <section className="py-4">
      <h2 className="text-2xl font-bold text-foreground mb-3 px-4 md:px-0">{title}</h2>
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

  const topListItems: TopListItemData[] = [
    { id: 'top1', title: 'POWER Tv Series', imageUrl: 'https://picsum.photos/seed/power/100/100', dataAiHint: 'drama series', hasMoreOptions: true },
    { id: 'top2', title: 'The Weeknd', imageUrl: 'https://picsum.photos/seed/theweeknd/100/100', dataAiHint: 'pop artist' },
    { id: 'top3', title: 'Burna Boy Mix', imageUrl: 'https://picsum.photos/seed/burnaboy/100/100', dataAiHint: 'afrobeats mix' },
    { id: 'top4', title: 'Bridget Blue Mix', imageUrl: 'https://picsum.photos/seed/bridgetblue/100/100', dataAiHint: 'female artist' },
    { id: 'top5', title: 'Starboy', imageUrl: 'https://picsum.photos/seed/starboyalbum/100/100', dataAiHint: 'rnb album' },
    { id: 'top6', title: 'Daily Mix 1', imageUrl: 'https://picsum.photos/seed/dailymix1/100/100', dataAiHint: 'playlist mix' },
  ];

  const artistsYouLike: CardItem[] = [
    { id: 'artist1', title: 'Diamond Platnumz Mix', subtitle: 'Lava Lava, Ben Pol and Mimi Mars', imageUrl: 'https://picsum.photos/seed/diamondplatnumz/300/300', dataAiHint: 'african artist' },
    { id: 'artist2', title: 'Taylor Swift Mix', subtitle: 'The Weeknd, Ariana Grande and Katy Perry', imageUrl: 'https://picsum.photos/seed/taylorswift/300/300', dataAiHint: 'pop singer' },
    { id: 'artist3', title: 'Drake Radio', subtitle: 'Hip Hop, Rap Caviar, and more', imageUrl: 'https://picsum.photos/seed/drakeradio/300/300', dataAiHint: 'rap hiphop' },
    { id: 'artist4', title: 'Sauti Sol Essentials', subtitle: 'Kenyan Afro-Pop Hits', imageUrl: 'https://picsum.photos/seed/sautisol/300/300', dataAiHint: 'kenyan music' },
  ];

  const madeForYou: CardItem[] = [
    { id: 'made1', title: 'Discover Weekly', subtitle: 'Your weekly mixtape of fresh music.', imageUrl: 'https://picsum.photos/seed/discoverweekly/300/300', dataAiHint: 'playlist discover' },
    { id: 'made2', title: 'Release Radar', subtitle: 'Catch all the latest music from artists you follow.', imageUrl: 'https://picsum.photos/seed/releaseradar/300/300', dataAiHint: 'new releases' },
    { id: 'made3', title: 'Chill Vibes', subtitle: 'Relax and unwind with these laid-back tracks.', imageUrl: 'https://picsum.photos/seed/chillvibes/300/300', dataAiHint: 'lofi chill' },
    { id: 'made4', title: 'Workout Beats', subtitle: 'Energy boosting tracks for your workout.', imageUrl: 'https://picsum.photos/seed/workoutbeats/300/300', dataAiHint: 'gym fitness' },
  ];

  // TODO: Filter content based on activeFilter
  // For now, showing all sections regardless of filter.
  let displayedTopList = topListItems;
  let displayedArtists = artistsYouLike;
  let displayedMadeForYou = madeForYou;

  if (activeFilter === 'Music') {
    // Example: filter out non-music, if applicable
  } else if (activeFilter === 'Podcasts') {
    displayedArtists = []; // Hide artist mixes for podcasts
    // Modify displayedMadeForYou and displayedTopList to show podcast related content
    // This requires more specific data for podcasts
  }


  return (
    <div className="text-foreground pb-12"> {/* Add padding-bottom for PlayerBar + BottomNav */}
      <div className="sticky top-0 bg-background z-10 py-3"> {/* Sticky filter bar */}
        <ScrollArea className="w-full whitespace-nowrap px-4 md:px-0">
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
      </div>

      {/* Top List Section - Grid */}
      <section className="pt-4 px-4 md:px-0">
        {/* This section title might be implicit or part of the header in Spotify UI */}
        {/* <h2 className="text-xl font-bold text-foreground mb-3">Good afternoon</h2> */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {displayedTopList.map((item) => (
            <TopListItemCard key={item.id} {...item} />
          ))}
        </div>
      </section>

      <LibrarySection title="Artists you like" items={displayedArtists} itemType="default" />
      <LibrarySection title="Made For You" items={displayedMadeForYou} itemType="default" />
    </div>
  );
};

export default LibraryContent;
