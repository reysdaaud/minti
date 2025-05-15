// src/components/library/LibraryContent.tsx
'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import LibraryCard from './LibraryCard';
import TopListItemCard from './TopListItemCard'; // Keep for "Good afternoon" section
import { Loader2, AlertTriangle, Music, Podcast as PodcastIcon } from 'lucide-react'; // Renamed Podcast to PodcastIcon
import type { ContentItem } from '@/services/contentService';

// Placeholder audio source. Replace with actual audio URLs.
const SAMPLE_AUDIO_SRC_1 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
const SAMPLE_AUDIO_SRC_2 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
const SAMPLE_AUDIO_SRC_3 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3";


interface CardSectionProps {
  title: string;
  items: ContentItem[];
}

const CardSection: FC<CardSectionProps> = ({ title, items }) => {
  const audioItems = items.filter(item => item.audioSrc && item.audioSrc.trim() !== '');

  if (audioItems.length === 0) {
    return null; // Don't render section if no audio items
  }

  return (
    <section className="py-4">
      <h2 className="text-2xl font-bold text-foreground mb-3 px-4 md:px-0">{title}</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 pb-4 px-4 md:px-0">
          {audioItems.map((item) => (
            <LibraryCard
              key={item.id}
              id={item.id}
              title={item.title}
              subtitle={item.subtitle}
              imageUrl={item.imageUrl}
              audioSrc={item.audioSrc!} 
              dataAiHint={item.dataAiHint}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};


const LibraryContent: FC = () => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Music' | 'Podcasts'>('All');
  const filters: Array<'All' | 'Music' | 'Podcasts'> = ['All', 'Music', 'Podcasts'];

  const [topListItems, setTopListItems] = useState<ContentItem[]>([]);
  const [musicItems, setMusicItems] = useState<ContentItem[]>([]);
  const [podcastItems, setPodcastItems] = useState<ContentItem[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLibraryContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const contentCollectionRef = collection(db, 'content');
        
        const qConstraints: QueryConstraint[] = [
            where('audioSrc', '!=', null),
            orderBy('createdAt', 'desc')
        ];
        
        const contentQuery = query(contentCollectionRef, ...qConstraints);
        const querySnapshot = await getDocs(contentQuery);
        
        const allAudioItems = querySnapshot.docs.map(doc => {
          const data = doc.data();
          if (!data.title || !data.imageUrl || !data.audioSrc || typeof data.audioSrc !== 'string' || data.audioSrc.trim() === '' || !data.dataAiHint) {
            return null; 
          }
          return {
            id: doc.id,
            ...data
          } as ContentItem;
        }).filter(item => item !== null && item.audioSrc && item.audioSrc.trim() !== '') as ContentItem[];

        // Populate TopList (e.g., first 6 items, or could be a specific category)
        setTopListItems(allAudioItems.slice(0, 6));
        
        // Filter for Music and Podcasts
        setMusicItems(allAudioItems.filter(item => item.category === 'Music'));
        setPodcastItems(allAudioItems.filter(item => item.category === 'Podcast'));

      } catch (err) {
        console.error("Error fetching library content:", err);
        setError("Failed to load library content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryContent();
  }, []); // Fetch once on mount

  const getDisplayedItems = () => {
    if (activeFilter === 'Music') return musicItems;
    if (activeFilter === 'Podcasts') return podcastItems;
    // For 'All', we could display sections or merge all. Let's display sections.
    return []; // 'All' will render sections directly
  };

  const getEmptyStateIcon = () => {
    switch(activeFilter) {
      case 'Music': return <Music className="mx-auto h-12 w-12 text-muted-foreground mb-3" />;
      case 'Podcasts': return <PodcastIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />; // Use PodcastIcon
      default: return <Music className="mx-auto h-12 w-12 text-muted-foreground mb-3" />;
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p>Loading library...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-destructive px-4 text-center min-h-[calc(100vh-200px)]">
        <AlertTriangle className="h-10 w-10 mb-3" />
        <p className="text-xl font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }
  
  const displayedItems = getDisplayedItems();

  return (
    <div className="text-foreground pb-12">
      <div className="sticky top-0 bg-background z-10 py-3">
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
      
      {/* Good Afternoon Section - always show for 'All' or if topListItems are relevant */}
      {(activeFilter === 'All' && topListItems.length > 0) && (
        <section className="pt-4 px-4 md:px-0">
          <h2 className="text-xl font-bold text-foreground mb-3">Good afternoon</h2>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {topListItems.map((item) => (
              <TopListItemCard 
                key={item.id} 
                id={item.id} 
                title={item.title} 
                imageUrl={item.imageUrl}
                audioSrc={item.audioSrc!}
                dataAiHint={item.dataAiHint}
                artist={item.subtitle} // Assuming subtitle can be used as artist for TopListItem
                hasMoreOptions // Example: always show more options for these
              />
            ))}
          </div>
        </section>
      )}

      {activeFilter === 'All' ? (
        <>
          <CardSection title="Music" items={musicItems} />
          <CardSection title="Podcasts" items={podcastItems} />
          {/* You can add more sections here like "Artists you like", "Made For You" by creating similar fetching logic */}
        </>
      ) : displayedItems.length > 0 ? (
         <CardSection title={activeFilter} items={displayedItems} />
      ) : (
        <div className="text-center py-10 px-4 min-h-[calc(100vh-350px)] flex flex-col justify-center items-center">
          {getEmptyStateIcon()}
          <p className="text-muted-foreground text-lg">No {activeFilter.toLowerCase()} found.</p>
          <p className="text-muted-foreground text-sm">Check back later or explore other categories!</p>
        </div>
      )}
    </div>
  );
};

export default LibraryContent;
