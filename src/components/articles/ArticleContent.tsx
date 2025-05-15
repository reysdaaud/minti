// src/components/articles/ArticleContent.tsx
'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, QueryConstraint, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ContentItem } from '@/services/contentService';
import { Loader2, AlertTriangle, Newspaper, Search, Filter } from 'lucide-react';
import ArticleCard from './ArticleCard';

const ArticleContent: FC = () => {
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const contentCollectionRef = collection(db, 'content');
        
        const queryConstraints: QueryConstraint[] = [
          where('fullBodyContent', '>', ''), 
          orderBy('fullBodyContent'), // This helps Firestore with the '>' filter
          orderBy('createdAt', 'desc')    
        ];
        
        const articlesQuery = query(contentCollectionRef, ...queryConstraints);
        
        const querySnapshot = await getDocs(articlesQuery);
        const fetchedItems = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
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
            audioSrc: typeof data.audioSrc === 'string' ? data.audioSrc : undefined,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : undefined, // Ensure it's a Timestamp or undefined
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : undefined,
          } as ContentItem;
        }).filter(item => item !== null && (!item.audioSrc || item.audioSrc.trim() === '')) as ContentItem[];
        // Final client-side filter to ensure no audioSrc for articles
        
        setArticles(fetchedItems);

      } catch (err: any) {
        console.error("Error fetching articles:", err);
         if (err.code === 'failed-precondition') {
             setError(`Firestore query for articles requires an index. Please check the Firebase console for a link to create it, or manually create an index on 'fullBodyContent' (Ascending) and 'createdAt' (Descending). Error: ${err.message}`);
        } else {
            setError("Failed to load articles. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const handleToggleExpand = (articleId: string) => {
    setExpandedArticleId(prevId => prevId === articleId ? null : articleId);
  };

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

  const articlesToDisplay = expandedArticleId 
    ? articles.filter(article => article.id === expandedArticleId) 
    : articles;

  if (articlesToDisplay.length === 0 && !expandedArticleId) { // Only show no articles if not specifically viewing one that might have been filtered out
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center min-h-[calc(100vh-200px)] px-4">
        <Newspaper className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl text-muted-foreground font-semibold">No Articles Found</p>
        <p className="text-muted-foreground">Check back later for new stories and updates!</p>
      </div>
    );
  }
  
  if (articlesToDisplay.length === 0 && expandedArticleId) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center min-h-[calc(100vh-200px)] px-4">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-destructive font-semibold">Article Not Found</p>
        <p className="text-muted-foreground">The selected article could not be displayed.</p>
        <button onClick={() => setExpandedArticleId(null)} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
            Back to Articles
        </button>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-6">
      {!expandedArticleId && (
        <div className="flex items-center justify-between mb-6 px-0 sm:px-4">
          <button className="flex items-center text-foreground/90 hover:text-primary transition-colors">
            <Filter className="h-5 w-5 mr-2" />
            Filter +
          </button>
          <button className="text-foreground/90 hover:text-primary transition-colors">
            <Search className="h-6 w-6" />
          </button>
        </div>
      )}
      <div className={`space-y-8 ${expandedArticleId ? '' : 'md:grid md:grid-cols-2 md:gap-x-8 md:space-y-0 lg:grid-cols-3'}`}>
        {articlesToDisplay.map((article) => (
          <ArticleCard 
            key={article.id} 
            article={article}
            isCurrentlyExpanded={expandedArticleId === article.id}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>
       {expandedArticleId && (
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => setExpandedArticleId(null)}
            className="text-foreground/90 hover:text-primary border-primary/50 hover:border-primary transition-colors"
          >
            Back to All Articles
          </Button>
        </div>
      )}
    </div>
  );
};

export default ArticleContent;
