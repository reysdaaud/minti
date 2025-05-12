// src/components/library/LibraryContent.tsx
'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, type QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import LibraryCard from './LibraryCard';
import { Loader2, AlertTriangle } from 'lucide-react';

// Define the structure of a content item from Firestore
export interface ContentItem {
  id: string;
  title: string;
  subtitle?: string; // Or artist
  imageUrl: string;
  audioSrc: string;
  dataAiHint: string;
  category?: 'Music' | 'Podcast' | string; // For filtering
  // Add any other fields that might come from Firestore
}

// Interface for the LibrarySection component props
interface LibrarySectionProps {
  title: string;
  items: ContentItem[];
}

const LibrarySection: FC<LibrarySectionProps> = ({ title, items }) => {
  if (items.length === 0) {
    return (
      <section className="py-4 px-4 md:px-0">
        <h2 className="text-2xl font-bold text-foreground mb-3">{title}</h2>
        <p className="text-muted-foreground">No items found in this section.</p>
      </section>
    );
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
              audioSrc={item.audioSrc}
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

  const [libraryItems, setLibraryItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLibraryContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const contentCollectionRef = collection(db, 'content');
        let contentQuery: QueryConstraint | any = contentCollectionRef; // Type any for simplicity here, or use specific query type

        if (activeFilter !== 'All') {
          // Assuming items in Firestore have a 'category' field matching 'Music' or 'Podcast'
          contentQuery = query(contentCollectionRef, where('category', '==', activeFilter));
        }
        
        const querySnapshot = await getDocs(contentQuery);
        const items = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // Basic validation: Ensure essential fields are present
          if (!data.title || !data.imageUrl || !data.audioSrc || !data.dataAiHint) {
            console.warn(`Item with ID ${doc.id} is missing essential fields and will be filtered out.`);
            return null; 
          }
          return {
            id: doc.id,
            title: data.title,
            subtitle: data.subtitle,
            imageUrl: data.imageUrl,
            audioSrc: data.audioSrc,
            dataAiHint: data.dataAiHint,
            category: data.category,
          } as ContentItem;
        }).filter(item => item !== null) as ContentItem[]; // Filter out null items and cast
        
        setLibraryItems(items);

      } catch (err) {
        console.error("Error fetching library content:", err);
        setError("Failed to load library content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryContent();
  }, [activeFilter]); // Refetch when filter changes

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
      
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p>Loading library...</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-10 text-destructive px-4 text-center">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && libraryItems.length === 0 && (
        <div className="text-center py-10 px-4">
          <p className="text-muted-foreground text-lg">Your library is currently empty for "{activeFilter}".</p>
          <p className="text-muted-foreground">Explore and add some content!</p>
        </div>
      )}

      {!loading && !error && libraryItems.length > 0 && (
         <LibrarySection title={activeFilter === 'All' ? "Your Library" : `${activeFilter}`} items={libraryItems} />
      )}
    </div>
  );
};

export default LibraryContent;
