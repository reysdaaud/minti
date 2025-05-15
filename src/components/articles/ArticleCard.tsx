// src/components/articles/ArticleCard.tsx
'use client';

import type { FC } from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ContentItem } from '@/services/contentService';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface ArticleCardProps {
  article: ContentItem;
}

const ArticleCard: FC<ArticleCardProps> = ({ article }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!article.fullBodyContent && !article.excerpt) {
    console.warn(`ArticleCard received an item (ID: ${article.id}) that does not have fullBodyContent or excerpt.`);
    return null;
  }

  const formattedDate = article.createdAt
    ? format(new Date(article.createdAt.seconds * 1000 + (article.createdAt.nanoseconds || 0) / 1000000), 'MMMM dd, yyyy')
    : 'Date unavailable';

  const metaInfo = `${article.category || 'Article'} | ${formattedDate}`;

  return (
    <Card className="w-full bg-transparent border-none shadow-none rounded-none mb-8">
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
        <CardTitle className="text-xl lg:text-2xl font-bold text-foreground mb-2 leading-tight hover:text-primary transition-colors cursor-pointer"  onClick={() => setIsExpanded(!isExpanded)}>
          {article.title}
        </CardTitle>

        {!isExpanded && article.excerpt && (
          <p className="text-sm text-foreground/80 line-clamp-3 mt-2 mb-3">
            {article.excerpt}
          </p>
        )}

        {isExpanded && article.fullBodyContent && (
          <div className="prose dark:prose-invert sm:prose-lg lg:prose-xl mt-4 text-foreground/90 whitespace-pre-line">
            {article.fullBodyContent.split('\\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}

        <Button
          variant="link"
          className="p-0 text-foreground/70 hover:text-primary transition-colors mt-3 text-sm flex items-center"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Read Less' : 'Read More'}
          {isExpanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ArrowRight className="ml-1 h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ArticleCard;
