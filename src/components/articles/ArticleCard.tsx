
// src/components/articles/ArticleCard.tsx
'use client';

import type { FC } from 'react';
import React from 'react'; // Import React for Fragment
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ContentItem } from '@/services/contentService';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { format, isValid } from 'date-fns';

interface ArticleCardProps {
  article: ContentItem;
  isCurrentlyExpanded: boolean;
  onToggleExpand: (articleId: string) => void;
}

const ArticleCard: FC<ArticleCardProps> = ({ article, isCurrentlyExpanded, onToggleExpand }) => {
  // console.log(`ArticleCard ${article.id}: Rendering. isCurrentlyExpanded = ${isCurrentlyExpanded}, Has fullBodyContent: ${!!article.fullBodyContent}, Has excerpt: ${!!article.excerpt}`);

  if (!article.fullBodyContent && !article.excerpt) {
    // console.warn(`ArticleCard received an item (ID: ${article.id}) that does not have fullBodyContent or excerpt.`);
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
            {article.fullBodyContent.split(/\n\s*\n/).map((paragraphBlock, pIndex) => ( // Split by one or more newlines (effectively \n\n or \n \n etc.)
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
        {(article.excerpt || article.fullBodyContent) && (
            <Button
            variant="outline"
            className="p-2 text-foreground/90 hover:text-primary transition-colors mt-3 text-sm flex items-center border-primary/50 hover:border-primary h-auto" 
            onClick={() => onToggleExpand(article.id)}
            aria-expanded={isCurrentlyExpanded}
            >
            {isCurrentlyExpanded ? 'Read Less' : 'Read More'}
            {isCurrentlyExpanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ArrowRight className="ml-1 h-4 w-4" />}
            </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ArticleCard;
