// src/components/articles/ArticleContent.tsx
'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, QueryConstraint, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ContentItem } from '@/services/contentService';
import { Loader2, AlertTriangle, Newspaper } from 'lucide-react';
import ArticleCard from './ArticleCard';

const ArticleContent: FC = () => {
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const contentCollectionRef = collection(db, 'content');
        
        // Query for documents that have fullBodyContent and do NOT have a non-empty audioSrc
        // Firestore doesn't have a "does not exist or is empty" query directly for strings.
        // A common approach is to query for items that are NOT audio, then client-filter,
        // or structure data so that "article" type is explicit.
        // For now, we'll fetch all non-audio, then client-side filter for fullBodyContent.
        // A more robust way would be to add an explicit 'contentType' field (e.g., 'article', 'audio')

        const queryConstraints: QueryConstraint[] = [
          // Option 1: If you want items that are explicitly NOT audio (audioSrc is null or empty)
          // This might require an index if combined with orderBy on a different field.
          // where('audioSrc', 'in', [null, ""]), // This might not work as expected or require specific indexing.
          // For simplicity and to avoid complex indexing for this step, we'll fetch where fullBodyContent exists
          // and then refine client-side if needed, or assume if fullBodyContent exists, it's an article.
          where('fullBodyContent', '!=', null), // Ensures fullBodyContent exists
          where('fullBodyContent', '!=', ""),   // Ensures fullBodyContent is not empty
          orderBy('createdAt', 'desc')
        ];
        
        const articlesQuery = query(contentCollectionRef, ...queryConstraints);
        
        const querySnapshot = await getDocs(articlesQuery);
        const fetchedArticles = querySnapshot.docs.map(doc => {
          const data = doc.data();

          // Primary filter: if it has audioSrc, it's not purely an article for this tab
          if (data.audioSrc && data.audioSrc.trim() !== '') {
            return null;
          }

          // Validate essential article fields
          if (!data.title || typeof data.title !== 'string' || 
              !data.imageUrl || typeof data.imageUrl !== 'string' ||
              !data.fullBodyContent || typeof data.fullBodyContent !== 'string' || data.fullBodyContent.trim() === '' ||
              !data.dataAiHint || typeof data.dataAiHint !== 'string'
              ) {
            console.warn(`Content item ID ${doc.id} is missing essential article fields or has empty fullBodyContent and will be filtered out.`);
            return null; 
          }
          
          return {
            id: doc.id,
            title: data.title,
            subtitle: typeof data.subtitle === 'string' ? data.subtitle : undefined,
            imageUrl: data.imageUrl,
            dataAiHint: data.dataAiHint,
            category: typeof data.category === 'string' ? data.category : undefined,
            excerpt: typeof data.excerpt === 'string' ? data.excerpt : undefined, 
            fullBodyContent: data.fullBodyContent, 
            audioSrc: typeof data.audioSrc === 'string' ? data.audioSrc : undefined, // Retain for consistency
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          } as ContentItem;
        }).filter(item => item !== null) as ContentItem[]; 
        
        setArticles(fetchedArticles);

      } catch (err: any) {
        console.error("Error fetching articles:", err);
         if (err.code === 'failed-precondition') {
             setError(`Firestore query for articles requires an index. Please create it using the link in the console error message, or ensure your query is supported. Error: ${err.message}`);
        } else {
            setError("Failed to load articles. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p>Loading articles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-destructive px-4 text-center min-h-[calc(100vh-200px)]">
        <AlertTriangle className="h-10 w-10 mb-3" />
        <p className="text-xl font-semibold">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center min-h-[calc(100vh-200px)] px-4">
        <Newspaper className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl text-muted-foreground font-semibold">No Articles Found</p>
        <p className="text-muted-foreground">Check back later for new stories and updates!</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground mb-8 text-center sm:text-left">Latest Articles</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
};

export default ArticleContent;
