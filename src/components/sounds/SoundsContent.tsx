// src/components/sounds/SoundsContent.tsx
'use client';

import type { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy, QueryConstraint, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import AudioCard from './AudioCard';
import FeaturedAudioCard from './FeaturedAudioCard';
import SubTabs from '@/components/shared/SubTabs';
import { Loader2, AlertTriangle, Music, Podcast as PodcastIcon } from 'lucide-react';
import type { ContentItem } from '@/services/contentService';
import { Button } from '@/components/ui/button';

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
            <AudioCard
              key={item.id}
              audioItem={item}
              // onLike and onSave would be passed here if implemented
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};


const SoundsContent: FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'All' | 'Music' | 'Podcasts'>('All');
  const subTabFilters: Array<'All' | 'Music' | 'Podcasts'> = ['All', 'Music', 'Podcasts'];

  const [allAudioContent, setAllAudioContent] = useState<ContentItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<ContentItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSoundsContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const contentCollectionRef = collection(db, 'content');
      const audioQueryConstraints: QueryConstraint[] = [
        where('contentType', '==', 'audio'),
        orderBy('createdAt', 'desc')
      ];

      const contentQuery = query(contentCollectionRef, ...audioQueryConstraints);
      const querySnapshot = await getDocs(contentQuery);

      const fetchedAudioItems = querySnapshot.docs.map(doc => {
        const data = doc.data();
        if (!data.title || typeof data.title !== 'string' ||
            !data.imageUrl || typeof data.imageUrl !== 'string' ||
            typeof data.audioSrc !== 'string' || data.audioSrc.trim() === '' ||
            !data.dataAiHint || typeof data.dataAiHint !== 'string' ||
            data.contentType !== 'audio') {
          console.warn("Skipping invalid audio item:", doc.id, data);
          return null;
        }
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : undefined,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : undefined,
        } as ContentItem;
      }).filter(item => item !== null) as ContentItem[];

      setAllAudioContent(fetchedAudioItems);
      setFeaturedItems(fetchedAudioItems.slice(0, 6));

    } catch (err: any) {
      console.error("Error fetching sounds content:", err);
      if (err.code === 'failed-precondition') {
           setError(`Firestore query for audio content requires an index. Please create it (likely on 'contentType' Ascending and 'createdAt' Descending) using the link in the Firebase console error message, then refresh. Error: ${err.message}`);
      } else {
          setError("Failed to load your sounds library. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSoundsContent();
  }, [fetchSoundsContent]);

  const getFilteredItems = (): ContentItem[] => {
    if (activeSubTab === 'All') return allAudioContent;
    if (activeSubTab === 'Music') return allAudioContent.filter(item => item.category === 'Music');
    if (activeSubTab === 'Podcasts') return allAudioContent.filter(item => item.category === 'Podcast'); // Ensure 'Podcast' matches category value
    return [];
  };

  const getEmptyStateIcon = () => {
    switch(activeSubTab) {
      case 'Music': return <Music className="mx-auto h-12 w-12 text-muted-foreground mb-3" />;
      case 'Podcasts': return <PodcastIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />;
      default: return <Music className="mx-auto h-12 w-12 text-muted-foreground mb-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p>Loading Sounds...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-destructive px-4 text-center min-h-[calc(100vh-200px)]">
        <AlertTriangle className="h-10 w-10 mb-3" />
        <p className="text-xl font-semibold">Error Loading Sounds</p>
        <p className="text-sm">{error}</p>
        <Button onClick={fetchSoundsContent} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const displayedItemsForActiveFilter = getFilteredItems();
  const musicItems = activeSubTab === 'All' ? allAudioContent.filter(item => item.category === 'Music') : (activeSubTab === 'Music' ? displayedItemsForActiveFilter : []);
  const podcastItems = activeSubTab === 'All' ? allAudioContent.filter(item => item.category === 'Podcast') : (activeSubTab === 'Podcasts' ? displayedItemsForActiveFilter : []);


  return (
    <div className="text-foreground pb-12">
      <SubTabs
        tabs={subTabFilters}
        activeTab={activeSubTab}
        onTabChange={(tab) => setActiveSubTab(tab as 'All' | 'Music' | 'Podcasts')}
      />
      
      {activeSubTab === 'All' && featuredItems.length > 0 && (
        <section className="pt-4 px-4 md:px-0">
          <h2 className="text-xl font-bold text-foreground mb-3">Good afternoon</h2>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {featuredItems.map((item) => (
              <FeaturedAudioCard
                key={item.id}
                audioItem={item}
              />
            ))}
          </div>
        </section>
      )}

      {activeSubTab === 'All' ? (
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
         <CardSection title={activeSubTab} items={displayedItemsForActiveFilter} />
      ) : (
        <div className="text-center py-10 px-4 min-h-[calc(100vh-350px)] flex flex-col justify-center items-center">
          {getEmptyStateIcon()}
          <p className="text-muted-foreground text-lg">No {activeSubTab.toLowerCase()} found.</p>
          <p className="text-muted-foreground text-sm">Check back later or explore other categories!</p>
        </div>
      )}
    </div>
  );
};

export default SoundsContent;
