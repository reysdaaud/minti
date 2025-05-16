// src/components/articles/ArticleContent.tsx
'use client';

import type { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy, QueryConstraint, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ContentItem } from '@/services/contentService';
import { Loader2, AlertTriangle, Newspaper } from 'lucide-react';
import ArticleCard from './ArticleCard';
import { Button } from '@/components/ui/button';
import SubTabs from '@/components/shared/SubTabs';

const ArticleContent: FC = () => {
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'Library' | 'Liked' | 'Most Viewed'>('Library');
  const subTabFilters: Array<'Library' | 'Liked' | 'Most Viewed'> = ['Library', 'Liked', 'Most Viewed'];

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const contentCollectionRef = collection(db, 'content');
      const queryConstraints: QueryConstraint[] = [
        where('contentType', '==', 'article'),
        orderBy('createdAt', 'desc')
      ];
      
      const articlesQuery = query(contentCollectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(articlesQuery);
      const fetchedItems = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        if (!data.title || typeof data.title !== 'string' || 
            !data.imageUrl || typeof data.imageUrl !== 'string' ||
            (data.contentType === 'article' && (!data.fullBodyContent || typeof data.fullBodyContent !== 'string')) ||
            !data.dataAiHint || typeof data.dataAiHint !== 'string'
            ) {
          console.warn("Skipping invalid article item:", doc.id, data);
          return null; 
        }
        
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : undefined, 
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : undefined,
        } as ContentItem;
      }).filter(item => item !== null) as ContentItem[]; 
      
      setArticles(fetchedItems);

    } catch (err: any) {
      console.error("Error fetching articles:", err);
       if (err.code === 'failed-precondition') {
           setError(`Firestore query for articles requires an index. Please check the Firebase console for a link to create it, or manually create an index on 'contentType' (Ascending) and 'createdAt' (Descending). Error: ${err.message}`);
      } else {
          setError("Failed to load articles. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleToggleExpand = useCallback((articleId: string | null) => {
    console.log("ArticleContent: Toggling expand for article ID:", articleId, "Current expanded ID:", expandedArticleId);
    setExpandedArticleId(prevId => (prevId === articleId ? null : articleId));
  }, [expandedArticleId]);


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
        <Button onClick={fetchArticles} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }
  
  let articlesToDisplay = articles;
  // Placeholder for Liked/Most Viewed filtering - currently shows all from Library
  if (activeSubTab === 'Liked') {
    // articlesToDisplay = articles.filter(a => /* logic for liked */ true); 
    console.log("Liked tab selected - showing all articles as placeholder");
  } else if (activeSubTab === 'Most Viewed') {
    // articlesToDisplay = articles.sort((a,b) => /* logic for most viewed */ 0);
    console.log("Most Viewed tab selected - showing all articles as placeholder");
  }


  // If an article is expanded, only show that article for the "Library" sub-tab
  // For "Liked" and "Most Viewed", this logic might need adjustment later
  if (expandedArticleId && activeSubTab === 'Library') {
    articlesToDisplay = articles.filter(article => article.id === expandedArticleId);
  }
  
  if (articlesToDisplay.length === 0 && (activeSubTab !== 'Library' || (activeSubTab === 'Library' && articles.length === 0))) {
    const message = activeSubTab === 'Library' ? "No articles found." : `No articles in "${activeSubTab}".`;
    const subMessage = activeSubTab === 'Library' ? "Check back later for new stories and updates!" : "Explore other sections or like some articles!";
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center min-h-[calc(100vh-200px)] px-4">
        <Newspaper className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl text-muted-foreground font-semibold">{message}</p>
        <p className="text-muted-foreground">{subMessage}</p>
      </div>
    );
  }
  
  if (articlesToDisplay.length === 0 && expandedArticleId && activeSubTab === 'Library') {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center min-h-[calc(100vh-200px)] px-4">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-destructive font-semibold">Article Not Found</p>
        <p className="text-muted-foreground">The selected article could not be displayed.</p>
        <Button 
            variant="outline"
            onClick={() => handleToggleExpand(null)} 
            className="mt-4 text-foreground/90 hover:text-primary border-primary/50 hover:border-primary transition-colors"
        >
            Back to All Articles
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-0">
      <SubTabs
        tabs={subTabFilters}
        activeTab={activeSubTab}
        onTabChange={(tab) => {
          setActiveSubTab(tab as 'Library' | 'Liked' | 'Most Viewed');
          setExpandedArticleId(null); // Collapse any expanded article when changing sub-tabs
        }}
      />
      {expandedArticleId && activeSubTab === 'Library' && (
        <div className="mt-6 mb-4 text-left">
          <Button
            variant="outline"
            onClick={() => handleToggleExpand(null)}
            className="text-foreground/90 hover:text-primary border-primary/50 hover:border-primary transition-colors py-2 px-4"
          >
            Back to All Articles
          </Button>
        </div>
      )}
      <div className={`mt-4 space-y-8 ${expandedArticleId && activeSubTab === 'Library' ? '' : 'md:grid md:grid-cols-2 md:gap-x-8 md:space-y-0 lg:grid-cols-3'}`}>
        {articlesToDisplay.map((article) => (
          <ArticleCard 
            key={article.id} 
            article={article}
            isCurrentlyExpanded={expandedArticleId === article.id}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>
    </div>
  );
};

export default ArticleContent;
