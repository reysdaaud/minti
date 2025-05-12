// src/components/admin/ContentList.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, PlusCircle, Music, Podcast, List } from 'lucide-react';
import type { ContentItem } from '@/services/contentService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ContentListProps {
  items: ContentItem[];
  onEdit: (item: ContentItem) => void;
  onDelete: (itemId: string) => Promise<void>;
  isLoadingDelete?: string | null; // ID of item being deleted
}

const CategoryIcon: FC<{ category?: string }> = ({ category }) => {
  switch (category) {
    case 'Music':
      return <Music className="h-4 w-4 text-primary" />;
    case 'Podcast':
      return <Podcast className="h-4 w-4 text-primary" />;
    default:
      return <List className="h-4 w-4 text-muted-foreground" />;
  }
};

const ContentList: FC<ContentListProps> = ({ items, onEdit, onDelete, isLoadingDelete }) => {
  if (items.length === 0) {
    return <p className="text-muted-foreground">No content items found.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-col bg-card text-card-foreground border-border">
          <CardHeader>
            <div className="relative aspect-video w-full rounded-t-md overflow-hidden mb-2">
              <Image
                src={item.imageUrl || `https://picsum.photos/seed/${item.id}/300/200`}
                alt={item.title}
                layout="fill"
                objectFit="cover"
                data-ai-hint={item.dataAiHint || "item image"}
              />
            </div>
            <CardTitle className="text-lg truncate">{item.title}</CardTitle>
            {item.subtitle && <CardDescription className="truncate">{item.subtitle}</CardDescription>}
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
              <CategoryIcon category={item.category} />
              <span>{item.category || 'Uncategorized'}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              ID: {item.id}
            </p>
             <p className="text-xs text-muted-foreground mt-1">
              Audio: <a href={item.audioSrc} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-full">{item.audioSrc}</a>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              AI Hint: {item.dataAiHint}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 border-t border-border/50 pt-4">
            <Button variant="outline" size="sm" onClick={() => onEdit(item)} aria-label={`Edit ${item.title}`}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" aria-label={`Delete ${item.title}`} disabled={isLoadingDelete === item.id}>
                  {isLoadingDelete === item.id ? (
                     <Trash2 className="mr-2 h-4 w-4 animate-pulse" />
                  ) : (
                     <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the content item titled &quot;{item.title}&quot;.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                        await onDelete(item.id);
                    }}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Confirm Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ContentList;
