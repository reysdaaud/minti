// src/components/admin/ContentForm.tsx
'use client';

import type { FC } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
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
}from '@/components/ui/select';
import type { ContentItem, ContentItemData } from '@/services/contentService';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  contentType: z.enum(['audio', 'article'], { required_error: "Content type is required" }),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  imageUrl: z.string().url({ message: "Invalid URL. Must start with http:// or https://"}).min(1, 'Image URL is required'),
  dataAiHint: z.string().min(1, 'AI Hint is required').max(50, 'AI Hint too long (max 50 chars)'),
  category: z.string().optional().default('Music'), // Allow any string, default to 'Music' or could be specific enum
  audioSrc: z.string().url({ message: "Invalid URL. Must start with http:// or https://" }).optional(),
  excerpt: z.string().optional(),
  fullBodyContent: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.contentType === 'audio' && !data.audioSrc) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Audio URL is required for audio content.',
      path: ['audioSrc'],
    });
  }
  if (data.contentType === 'article') {
    if (!data.excerpt || data.excerpt.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Excerpt is required for article content.',
        path: ['excerpt'],
      });
    }
    if (!data.fullBodyContent || data.fullBodyContent.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Full body content is required for article content.',
        path: ['fullBodyContent'],
      });
    }
  }
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
          contentType: initialData.contentType || 'audio',
          title: initialData.title,
          subtitle: initialData.subtitle || '',
          imageUrl: initialData.imageUrl,
          audioSrc: initialData.audioSrc || '',
          dataAiHint: initialData.dataAiHint,
          category: initialData.category || 'Music',
          excerpt: initialData.excerpt || '',
          fullBodyContent: initialData.fullBodyContent || '',
        }
      : {
          contentType: 'audio',
          title: '',
          subtitle: '',
          imageUrl: '',
          audioSrc: '',
          dataAiHint: '',
          category: 'Music',
          excerpt: '',
          fullBodyContent: '',
        },
  });

  const contentType = form.watch('contentType');

  const handleFormSubmitInternal: SubmitHandler<ContentFormValues> = async (data) => {
    console.log("Attempting form submission with data (raw from RHF):", data);
    try {
      const parsedData = formSchema.parse(data);
      console.log("Zod parsed data successfully:", parsedData);
      await onSubmit(parsedData as ContentItemData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Direct Zod parsing error:", JSON.stringify(error.errors, null, 2));
         error.errors.forEach(err => {
          form.setError(err.path[0] as keyof ContentFormValues, { message: err.message });
        });
      } else {
        console.error("Error submitting form:", error);
      }
    }
  };
  
  const onFormValidationError = (errors: any) => {
    console.error("Form validation errors (argument from RHF):", errors);
    console.error("Current form values:", form.getValues());
    console.error("form.formState.errors from RHF state:", form.formState.errors);
    console.error("form.formState.errors from RHF state (JSON):", JSON.stringify(form.formState.errors, null, 2));
    console.log("form.formState.isValid:", form.formState.isValid);
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px] bg-card text-card-foreground overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Content' : 'Add New Content'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(handleFormSubmitInternal, onFormValidationError)} 
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="contentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-input text-foreground border-border">
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover text-popover-foreground">
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>Subtitle / Artist</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter subtitle or artist name" {...field} className="bg-input text-foreground border-border" />
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
                  <FormLabel>Image URL (Featured Image / Album Art)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/image.jpg" {...field} className="bg-input text-foreground border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {contentType === 'audio' && (
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
            )}

            {contentType === 'article' && (
              <>
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Short summary of the article..." {...field} className="bg-input text-foreground border-border min-h-[100px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullBodyContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Body Content</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Write the full article content here..." {...field} className="bg-input text-foreground border-border min-h-[200px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="dataAiHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Hint</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'pop music' or 'tech article'" {...field} className="bg-input text-foreground border-border" />
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
                      <SelectItem value="News">News</SelectItem>
                      <SelectItem value="Tech">Tech</SelectItem>
                      <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sticky bottom-0 bg-card py-4">
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
