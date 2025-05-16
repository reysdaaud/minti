// src/components/sounds/SoundsContent.tsx
'use client';

import type { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy, QueryConstraint, Timestamp, limit, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import AudioCard from './AudioCard';
import FeaturedAudioCard from './FeaturedAudioCard';
import SubTabs from '@/components/shared/SubTabs';
import { Loader2, AlertTriangle, Music, Podcast as PodcastIcon, ListMusic, Heart, Library } from 'lucide-react';
import type { ContentItem } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

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
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};


const SoundsContent: FC = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'All' | 'Music' | 'Podcasts' | 'My Library' | 'Liked Songs'>('All');
  const subTabFilters: Array<'All' | 'Music' | 'Podcasts' | 'My Library' | 'Liked Songs'> = ['All', 'Music', 'Podcasts', 'My Library', 'Liked Songs'];

  const [allAudioContent, setAllAudioContent] = useState<ContentItem[]>([]);
  const [musicContent, setMusicContent] = useState<ContentItem[]>([]);
  const [podcastContent, setPodcastContent] = useState<ContentItem[]>([]);
  const [myLibraryContent, setMyLibraryContent] = useState<ContentItem[]>([]);
  const [likedSongsContent, setLikedSongsContent] = useState<ContentItem[]>([]);

  const [featuredItems, setFeaturedItems] = useState<ContentItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContentForTab = useCallback(async (tab: typeof activeSubTab, currentProfile: typeof userProfile) => {
    setLoading(true);
    setError(null);
    let itemsToUpdateSetter: React.Dispatch<React.SetStateAction<ContentItem[]>> = setAllAudioContent;
    let isUserSpecificQuery = false;


    try {
      const contentCollectionRef = collection(db, 'content');
      let queryConstraints: QueryConstraint[] = [
        where('contentType', '==', 'audio'),
        // orderBy('createdAt', 'desc'), // General ordering, might be overridden or combined
      ];

      switch (tab) {
        case 'All':
          itemsToUpdateSetter = setAllAudioContent;
          // No additional category filter for 'All' audio
          queryConstraints.push(orderBy('createdAt', 'desc'));
          break;
        case 'Music':
          itemsToUpdateSetter = setMusicContent;
          queryConstraints.push(where('category', '==', 'Music'));
          queryConstraints.push(orderBy('createdAt', 'desc'));
          break;
        case 'Podcasts':
          itemsToUpdateSetter = setPodcastContent;
          queryConstraints.push(where('category', '==', 'Podcast'));
          queryConstraints.push(orderBy('createdAt', 'desc'));
          break;
        case 'My Library':
          itemsToUpdateSetter = setMyLibraryContent;
          isUserSpecificQuery = true;
          if (currentProfile?.savedContentIds && currentProfile.savedContentIds.length > 0) {
            const savedIdsToQuery = currentProfile.savedContentIds.slice(0, 30);
            if (savedIdsToQuery.length > 0) {
              queryConstraints.push(where(documentId(), 'in', savedIdsToQuery));
              // Firestore doesn't allow orderBy('createdAt') with 'in' on documentId() unless it's the same field.
              // We might need to sort client-side or accept default document ID order for these.
            } else {
              itemsToUpdateSetter([]); setLoading(false); return;
            }
          } else {
            itemsToUpdateSetter([]); setLoading(false); return;
          }
          break;
        case 'Liked Songs':
          itemsToUpdateSetter = setLikedSongsContent;
          isUserSpecificQuery = true;
          if (currentProfile?.likedContentIds && currentProfile.likedContentIds.length > 0) {
            const likedIdsToQuery = currentProfile.likedContentIds.slice(0, 30);
            if (likedIdsToQuery.length > 0) {
              queryConstraints.push(where(documentId(), 'in', likedIdsToQuery));
            } else {
              itemsToUpdateSetter([]); setLoading(false); return;
            }
          } else {
            itemsToUpdateSetter([]); setLoading(false); return;
          }
          break;
      }

      const contentQuery = query(contentCollectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(contentQuery);

      let fetchedItems = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure createdAt is a Date object, or undefined if not present/valid
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : 
                       (typeof data.createdAt === 'string' ? new Date(data.createdAt) : undefined),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : 
                       (typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : undefined),
        } as ContentItem;
      }).filter(item => item.contentType === 'audio' && item.audioSrc && item.audioSrc.trim() !== ''); // Ensure it's audio and has src

      // For user-specific queries (My Library, Liked Songs), client-side sorting by createdAt might be needed
      // if Firestore doesn't allow server-side sorting with 'in' queries on documentId efficiently
      if (isUserSpecificQuery && fetchedItems.length > 0 && fetchedItems.every(item => item.createdAt)) {
        fetchedItems.sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime());
      }


      itemsToUpdateSetter(fetchedItems);

      if (tab === 'All' && featuredItems.length === 0 && fetchedItems.length > 0) {
        // Create a distinct list for featured items to avoid mutation issues
        setFeaturedItems([...fetchedItems].sort(() => 0.5 - Math.random()).slice(0, 6));
      }

    } catch (err: any) {
      console.error(`Error fetching content for tab ${tab}:`, err);
      let specificErrorMessage = `Failed to load ${tab}. Please try again later.`;
      if (err.code === 'failed-precondition' || (err.message && err.message.toLowerCase().includes("index"))) {
           specificErrorMessage = `Firestore query requires an index for the "${tab}" tab. Please check the Firebase console error message (often in the browser console) for a link to create it. Firestore message: ${err.message || 'Index required.'}`;
      }
      setError(specificErrorMessage);
      itemsToUpdateSetter([]); // Clear content on error
    } finally {
      setLoading(false);
    }
  }, [featuredItems.length]); // featuredItems.length dependency might be too broad if we only want to set featured once

  useEffect(() => {
    if (!authLoading) {
        fetchContentForTab(activeSubTab, userProfile);
    }
  }, [activeSubTab, userProfile, authLoading, fetchContentForTab]);


  const getTabIcon = (tabName: typeof activeSubTab) => {
    switch(tabName) {
      case 'Music': return <Music className="mx-auto h-12 w-12 text-muted-foreground mb-3" />;
      case 'Podcasts': return <PodcastIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />;
      case 'My Library': return <Library className="mx-auto h-12 w-12 text-muted-foreground mb-3" />;
      case 'Liked Songs': return <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-3" />;
      default: return <ListMusic className="mx-auto h-12 w-12 text-muted-foreground mb-3" />;
    }
  };

  const renderTabContent = () => {
    let itemsToDisplay: ContentItem[] = [];
    let tabTitle = activeSubTab;

    switch(activeSubTab) {
      case 'All':
        itemsToDisplay = allAudioContent;
        break;
      case 'Music':
        itemsToDisplay = musicContent;
        break;
      case 'Podcasts':
        itemsToDisplay = podcastContent;
        break;
      case 'My Library':
         if (!user && !authLoading) return <div className="text-center py-10 px-4 min-h-[calc(100vh-350px)] flex flex-col justify-center items-center">
           <Library className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
           <p className="text-muted-foreground text-lg">Sign in to see your Library.</p>
         </div>;
        itemsToDisplay = myLibraryContent;
        tabTitle = "My Library";
        break;
      case 'Liked Songs':
         if (!user && !authLoading) return <div className="text-center py-10 px-4 min-h-[calc(100vh-350px)] flex flex-col justify-center items-center">
           <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
           <p className="text-muted-foreground text-lg">Sign in to see Liked Songs.</p>
         </div>;
        itemsToDisplay = likedSongsContent;
        tabTitle = "Liked Songs";
        break;
    }

    if (loading && !authLoading) { // Show loading only if auth is done and still loading content
      return (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground min-h-[calc(100vh-200px)]">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p>Loading {tabTitle}...</p>
        </div>
      );
    }
     if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-destructive px-4 text-center min-h-[calc(100vh-200px)]">
          <AlertTriangle className="h-10 w-10 mb-3" />
          <p className="text-xl font-semibold">Error Loading Content</p>
          <p className="text-sm whitespace-pre-line">{error}</p>
          <Button onClick={() => fetchContentForTab(activeSubTab, userProfile)} variant="outline" className="mt-4">
            Retry
          </Button>
        </div>
      );
    }

    if (itemsToDisplay.length === 0 && !loading) {
      return (
        <div className="text-center py-10 px-4 min-h-[calc(100vh-350px)] flex flex-col justify-center items-center">
          {getTabIcon(activeSubTab)}
          <p className="text-muted-foreground text-lg">No {tabTitle.toLowerCase()} found.</p>
          <p className="text-muted-foreground text-sm">
            {activeSubTab === 'My Library' ? "Save some tracks to see them here!" :
             activeSubTab === 'Liked Songs' ? "Like some songs to see them here!" :
             "Check back later or explore other categories!"}
          </p>
        </div>
      );
    }

    if (activeSubTab === 'All') {
        return (
            <>
                {musicContent.length > 0 && <CardSection title="Music" items={musicContent} />}
                {podcastContent.length > 0 && <CardSection title="Podcasts" items={podcastContent} />}
                {(musicContent.length === 0 && podcastContent.length === 0 && allAudioContent.length > 0 && (
                   <CardSection title="All Audio" items={allAudioContent} />
                ))}
            </>
        );
    }
    
    return <CardSection title={tabTitle} items={itemsToDisplay} />;
  };

  return (
    <div className="text-foreground pb-12">
      <SubTabs
        tabs={subTabFilters}
        activeTab={activeSubTab}
        onTabChange={(tab) => setActiveSubTab(tab as typeof activeSubTab)}
      />

      {activeSubTab === 'All' && featuredItems.length > 0 && !loading && !error && (
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
      {renderTabContent()}
    </div>
  );
};

export default SoundsContent;
