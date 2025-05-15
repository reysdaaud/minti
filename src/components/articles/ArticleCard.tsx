
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
  // Prioritize fullBodyContent for this check.
  if (!article.fullBodyContent && !article.excerpt) {
    console.warn(`ArticleCard received an item (ID: ${article.id}) that does not have fullBodyContent or excerpt.`);
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
        {/* Display excerpt if available */}
        {article.excerpt && (
          <p className="text-sm text-foreground/80 line-clamp-3">
            {article.excerpt}
          </p>
        )}
        {/* If no excerpt but fullBodyContent exists, this card will still render
            but might show less text in the preview. Consider showing a snippet of fullBodyContent
            if excerpt is empty but fullBodyContent is not.
        */}
      </CardContent>
      <CardFooter className="p-4 border-t border-border/50">
        {/* Link should ideally go to a dynamic page like /article/${article.id} */}
        {/* For now, a placeholder link is used. A proper routing setup is needed. */}
        <Button asChild variant="ghost" className="w-full text-primary hover:text-primary/90">
          <Link href={`#`}> 
            Read More <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ArticleCard;
