
// src/components/articles/ArticleCard.tsx
'use client';

import type { FC } from 'react';
import React from 'react'; 
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ContentItem } from '@/services/contentService';
import { ArrowRight, ChevronDown, ChevronUp, Heart, Bookmark } from 'lucide-react'; // Added Heart and Bookmark
import { format, isValid } from 'date-fns';

interface ArticleCardProps {
  article: ContentItem;
  isCurrentlyExpanded: boolean;
  onToggleExpand: (articleId: string | null) => void; 
  // onLike and onSave would be passed here if implemented
}

const ArticleCard: FC<ArticleCardProps> = ({ article, isCurrentlyExpanded, onToggleExpand }) => {
  if (!article.fullBodyContent && !article.excerpt) {
    return null;
  }

  const dateToFormat = article.createdAt?.seconds
    ? new Date(article.createdAt.seconds * 1000 + (article.createdAt.nanoseconds || 0) / 1000000)
    : null;

  const formattedDate = dateToFormat && isValid(dateToFormat)
    ? format(dateToFormat, 'MMMM dd, yyyy')
    : 'Date unavailable';

  const metaInfo = `${article.category || 'Article'} | ${formattedDate}`;

  return (
    <Card className="w-full bg-transparent border-none shadow-none rounded-none mb-8 break-inside-avoid-column">
      {article.imageUrl && (
        <div className="relative w-full aspect-[16/9] overflow-hidden mb-3 rounded-md">
          <Image
            src={article.imageUrl}
            alt={article.title}
            layout="fill"
            objectFit="cover"
            data-ai-hint={article.dataAiHint || "article image"}
          />
        </div>
      )}
      <CardContent className="p-0">
        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{metaInfo}</p>
        <CardTitle
            className="text-xl lg:text-2xl font-bold text-foreground mb-2 leading-tight hover:text-primary transition-colors cursor-pointer"
            onClick={() => onToggleExpand(article.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggleExpand(article.id)}
        >
          {article.title}
        </CardTitle>

        {!isCurrentlyExpanded && article.excerpt && (
          <p className="text-sm text-foreground/80 line-clamp-3 mt-2 mb-3">
            {article.excerpt}
          </p>
        )}

        {isCurrentlyExpanded && article.fullBodyContent && (
           <div className="prose dark:prose-invert sm:prose-lg lg:prose-xl mt-4 text-foreground/90">
            {article.fullBodyContent.split(/\n\s*\n|\n{2,}/).map((paragraphBlock, pIndex) => (
              <p key={pIndex}>
                {paragraphBlock.split('\n').map((line, lIndex, linesArray) => (
                  <React.Fragment key={lIndex}>
                    {line.trim()}
                    {lIndex < linesArray.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            ))}
          </div>
        )}
        
        <div className="mt-3 flex items-center space-x-3">
            {!isCurrentlyExpanded && (article.excerpt || article.fullBodyContent) && (
                <Button
                variant="outline"
                className="p-2 text-foreground/90 hover:text-primary transition-colors text-sm flex items-center border-primary/50 hover:border-primary h-auto" 
                onClick={() => onToggleExpand(article.id)}
                aria-expanded={isCurrentlyExpanded}
                >
                Read More
                <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
            )}
             {/* Like and Save buttons - Placeholder functionality */}
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary p-1" aria-label="Like article">
                <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary p-1" aria-label="Save article">
                <Bookmark className="h-5 w-5" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArticleCard;
