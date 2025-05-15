
// src/components/articles/ArticleContent.tsx
'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ContentItem } from '@/services/contentService';
import { Loader2, AlertTriangle, FileText } from 'lucide-react';
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
        // Fetch items that have fullBodyContent (indicating they are articles)
        // and ensure it's not an empty string.
        const queryConstraints: QueryConstraint[] = [
          where('fullBodyContent', '!=', null), // Ensure field exists
          // where('fullBodyContent', '>', ''), // Firestore way to check for non-empty string if indexed
          orderBy('createdAt', 'desc')
        ];
        
        const articlesQuery = query(contentCollectionRef, ...queryConstraints);
        
        const querySnapshot = await getDocs(articlesQuery);
        const fetchedArticles = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // Validate essential article fields
          if (!data.title || typeof data.title !== 'string' || 
              !data.imageUrl || typeof data.imageUrl !== 'string' ||
              // Excerpt is optional, but fullBodyContent must exist and not be empty for an "article"
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
            excerpt: data.excerpt || undefined, // Ensure excerpt is string or undefined
            fullBodyContent: data.fullBodyContent,
            audioSrc: data.audioSrc || undefined, // Include if it exists, though ArticleCard might not use it
          } as ContentItem;
        }).filter(item => item !== null) as ContentItem[]; // Filter out nulls from validation
        
        setArticles(fetchedArticles);

      } catch (err) {
        console.error("Error fetching articles:", err);
        setError("Failed to load articles. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Loading articles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-destructive px-4 text-center">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-lg">No articles found.</p>
        <p className="text-muted-foreground">Check back later for new content!</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">Articles</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
};

export default ArticleContent;
