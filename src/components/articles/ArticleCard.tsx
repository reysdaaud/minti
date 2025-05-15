// src/components/articles/ArticleCard.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { ContentItem } from '@/services/contentService';
import { ArrowRight } from 'lucide-react';

interface ArticleCardProps {
  article: ContentItem;
}

const ArticleCard: FC<ArticleCardProps> = ({ article }) => {
  // An item is considered an article if it has an excerpt or fullBodyContent.
  if (!article.fullBodyContent && !article.excerpt) {
    console.warn(`ArticleCard received an item (ID: ${article.id}) that does not have fullBodyContent or excerpt.`);
    return null; 
  }

  return (
    <Card className="flex flex-col overflow-hidden bg-card border-border shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0">
        {article.imageUrl && (
          <div className="relative w-full aspect-[16/9] overflow-hidden"> {/* Common aspect ratio for featured images */}
            <Image
              src={article.imageUrl}
              alt={article.title}
              layout="fill"
              objectFit="cover"
              data-ai-hint={article.dataAiHint || "article image"}
              className="transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <CardTitle className="text-lg lg:text-xl font-semibold text-foreground mb-2 line-clamp-2 hover:text-primary transition-colors">
          {/* For now, no direct link until detail page is implemented */}
          {article.title}
        </CardTitle>
        {article.subtitle && (
          <CardDescription className="text-xs text-muted-foreground mb-2 line-clamp-1">
            {article.subtitle}
          </CardDescription>
        )}
        {article.excerpt && (
          <p className="text-sm text-foreground/80 line-clamp-3 flex-grow">
            {article.excerpt}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t border-border/50 mt-auto">
        <Button asChild variant="link" className="w-full justify-start p-0 text-primary hover:text-primary/80">
          {/* Placeholder link, replace with actual article page later */}
          <Link href={`#`}> 
            Read More <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ArticleCard;
