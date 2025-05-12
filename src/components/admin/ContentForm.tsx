// src/components/admin/ContentForm.tsx
'use client';

import type { FC } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ContentItem, ContentItemData } from '@/services/contentService';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').min(1, 'Image URL is required'),
  audioSrc: z.string().url('Must be a valid URL').min(1, 'Audio URL is required'),
  dataAiHint: z.string().min(1, 'AI Hint is required').max(30, 'AI Hint too long'),
  category: z.enum(['Music', 'Podcast', 'Other']).optional().default('Music'),
});

type ContentFormValues = z.infer<typeof formSchema>;

interface ContentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContentItemData) => Promise<void>;
  initialData?: ContentItem | null;
  isLoading?: boolean;
}

const ContentForm: FC<ContentFormProps> = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          subtitle: initialData.subtitle || '',
          imageUrl: initialData.imageUrl,
          audioSrc: initialData.audioSrc,
          dataAiHint: initialData.dataAiHint,
          category: initialData.category as 'Music' | 'Podcast' | 'Other' || 'Music',
        }
      : {
          title: '',
          subtitle: '',
          imageUrl: '',
          audioSrc: '',
          dataAiHint: '',
          category: 'Music',
        },
  });

  const handleFormSubmit: SubmitHandler<ContentFormValues> = async (data) => {
    await onSubmit(data as ContentItemData);
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Content' : 'Add New Content'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title" {...field} className="bg-input text-foreground border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtitle/Artist</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter subtitle or artist" {...field} className="bg-input text-foreground border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/image.jpg" {...field} className="bg-input text-foreground border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="audioSrc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audio URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/audio.mp3" {...field} className="bg-input text-foreground border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dataAiHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Hint</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'pop music' or 'tech podcast'" {...field} className="bg-input text-foreground border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-input text-foreground border-border">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover text-popover-foreground">
                      <SelectItem value="Music">Music</SelectItem>
                      <SelectItem value="Podcast">Podcast</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Save Changes' : 'Add Content'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ContentForm;
