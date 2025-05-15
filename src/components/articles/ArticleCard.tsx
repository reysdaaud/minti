// src/components/articles/ArticleCard.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link'; // For linking to a full article page if needed
import type { ContentItem } from '@/services/contentService';
import { ArrowRight } from 'lucide-react';

interface ArticleCardProps {
  article: ContentItem; // We expect this to be an article with contentType 'article'
}

const ArticleCard: FC<ArticleCardProps> = ({ article }) => {
  // Basic validation for article type and essential fields
  if (article.contentType !== 'article' || !article.excerpt) {
    // Optionally render a placeholder or null if it's not a valid article for this card
    console.warn(`ArticleCard received an item that is not a valid article: ${article.id}`);
    return null; 
  }

  return (
    <Card className="flex flex-col overflow-hidden bg-card border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        {article.imageUrl && (
          <div className="relative w-full h-48">
            <Image
              src={article.imageUrl}
              alt={article.title}
              layout="fill"
              objectFit="cover"
              data-ai-hint={article.dataAiHint || "article image"}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-semibold text-primary mb-2 line-clamp-2">
          {article.title}
        </CardTitle>
        {article.subtitle && (
          <CardDescription className="text-sm text-muted-foreground mb-1 line-clamp-1">
            {article.subtitle}
          </CardDescription>
        )}
        <p className="text-sm text-foreground/80 line-clamp-3">
          {article.excerpt}
        </p>
      </CardContent>
      <CardFooter className="p-4 border-t border-border/50">
        {/* Placeholder for a "Read More" link. This would navigate to a dynamic article page e.g., /articles/[id] */}
        <Button asChild variant="ghost" className="w-full text-primary hover:text-primary/90">
          <Link href={`#`}> {/* Replace # with actual link, e.g., /articles/${article.id} */}
            Read More <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ArticleCard;
