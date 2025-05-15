// src/components/library/LibraryContent.tsx
'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, QueryConstraint, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import LibraryCard from './LibraryCard';
import TopListItemCard from './TopListItemCard';
import { Loader2, AlertTriangle, Music, Podcast as PodcastIcon } from 'lucide-react';
import type { ContentItem } from '@/services/contentService';

interface CardSectionProps {
  title: string;
  items: ContentItem[];
}

const CardSection: FC<CardSectionProps> = ({ title, items }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="py-4">
      <h2 className="text-2xl font-bold text-foreground mb-3 px-4 md:px-0">{title}</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 pb-4 px-4 md:px-0">
          {items.map((item) => (
            <LibraryCard
              key={item.id}
              id={item.id}
              title={item.title}
              subtitle={item.subtitle}
              imageUrl={item.imageUrl}
              audioSrc={item.audioSrc!} // Asserting audioSrc is present due to filtering
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

  const [allAudioContent, setAllAudioContent] = useState<ContentItem[]>([]);
  const [topListItems, setTopListItems] = useState<ContentItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLibraryContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const contentCollectionRef = collection(db, 'content');

        const audioQueryConstraints: QueryConstraint[] = [
            where('audioSrc', '!=', null), // Firestore check for existence
            orderBy('createdAt', 'desc')
        ];

        const contentQuery = query(contentCollectionRef, ...audioQueryConstraints);
        const querySnapshot = await getDocs(contentQuery);

        const fetchedAudioItems = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // Client-side validation for truly valid audio items
          if (!data.title || typeof data.title !== 'string' ||
              !data.imageUrl || typeof data.imageUrl !== 'string' ||
              typeof data.audioSrc !== 'string' || data.audioSrc.trim() === '' || // Ensure audioSrc is non-empty string
              !data.dataAiHint || typeof data.dataAiHint !== 'string') {
            console.warn(`Client-side filter: Content item ID ${doc.id} missing essential fields or has empty audioSrc. Filtering out from library display.`);
            return null;
          }
          return {
            id: doc.id,
            ...data,
            // Ensure createdAt is handled if it's a Firestore Timestamp
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)
          } as ContentItem;
        }).filter(item => item !== null) as ContentItem[];

        setAllAudioContent(fetchedAudioItems);
        setTopListItems(fetchedAudioItems.slice(0, 6));

      } catch (err: any) {
        console.error("Error fetching library content:", err);
        if (err.code === 'failed-precondition') {
             setError(`Firestore query requires an index. Please create it using the link in the console error message, then refresh. Error: ${err.message}`);
        } else {
            setError("Failed to load your library. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryContent();
  }, []);

  const getFilteredItems = (filter: 'All' | 'Music' | 'Podcasts'): ContentItem[] => {
    if (filter === 'All') return allAudioContent;
    return allAudioContent.filter(item => item.category === filter);
  };

  const musicItems = getFilteredItems('Music');
  const podcastItems = getFilteredItems('Podcasts');


  const getEmptyStateIcon = () => {
    switch(activeFilter) {
      case 'Music': return <Music className="mx-auto h-12 w-12 text-muted-foreground mb-3" />;
      case 'Podcasts': return <PodcastIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />;
      default: return <Music className="mx-auto h-12 w-12 text-muted-foreground mb-3" />;
    }
  };

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
        <p className="text-xl font-semibold">Error Loading Library</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const displayedItemsForActiveFilter = getFilteredItems(activeFilter);

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
                artist={item.subtitle}
                hasMoreOptions
              />
            ))}
          </div>
        </section>
      )}

      {activeFilter === 'All' ? (
        <>
          {musicItems.length > 0 && <CardSection title="Music" items={musicItems} />}
          {podcastItems.length > 0 && <CardSection title="Podcasts" items={podcastItems} />}
          {musicItems.length === 0 && podcastItems.length === 0 && allAudioContent.length === 0 && (
            <div className="text-center py-10 px-4 min-h-[calc(100vh-350px)] flex flex-col justify-center items-center">
              {getEmptyStateIcon()}
              <p className="text-muted-foreground text-lg">No audio content found in your library.</p>
              <p className="text-muted-foreground text-sm">Try adding some music or podcasts!</p>
            </div>
          )}
        </>
      ) : displayedItemsForActiveFilter.length > 0 ? (
         <CardSection title={activeFilter} items={displayedItemsForActiveFilter} />
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
