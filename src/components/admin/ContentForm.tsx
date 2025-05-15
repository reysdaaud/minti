
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
}from '@/components/ui/select';
import type { ContentItem, ContentItemData } from '@/services/contentService';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Unified schema: all type-specific fields are optional
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  imageUrl: z.string().url({ message: "Image URL must be a valid URL (e.g., https://example.com/image.png)"}).min(1, 'Image URL is required'),
  dataAiHint: z.string().min(1, 'AI Hint is required').max(50, 'AI Hint too long (max 50 chars)'),
  category: z.string().optional(), // General category
  audioSrc: z.string().url({ message: "Audio URL must be a valid URL (e.g., https://example.com/audio.mp3)" }).optional().or(z.literal('')),
  excerpt: z.string().optional(),
  fullBodyContent: z.string().optional(),
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
  const { toast } = useToast();
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          subtitle: initialData.subtitle || '',
          imageUrl: initialData.imageUrl,
          audioSrc: initialData.audioSrc || '',
          dataAiHint: initialData.dataAiHint,
          category: initialData.category || 'Music', // Default if category was not set
          excerpt: initialData.excerpt || '',
          fullBodyContent: initialData.fullBodyContent || '',
        }
      : { // Default for new item
          title: '',
          subtitle: '',
          imageUrl: '',
          audioSrc: '',
          dataAiHint: '',
          category: 'Music', // Default category for new items
          excerpt: '',
          fullBodyContent: '',
        },
  });

  const handleFormSubmitInternal: SubmitHandler<ContentFormValues> = async (data) => {
    console.log("Attempting form submission with data (raw from RHF):", data);
    try {
      const parsedData = formSchema.parse(data);
      console.log("Zod parsed data successfully:", parsedData);
      
      const submissionData: ContentItemData = {
        ...parsedData,
        audioSrc: parsedData.audioSrc || undefined, // Ensure empty string becomes undefined
        excerpt: parsedData.excerpt || undefined,
        fullBodyContent: parsedData.fullBodyContent || undefined,
        subtitle: parsedData.subtitle || undefined,
        category: parsedData.category || undefined,
      };
      await onSubmit(submissionData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Direct Zod parsing error:", JSON.stringify(error.errors, null, 2));
         error.errors.forEach(err => {
          form.setError(err.path[0] as keyof ContentFormValues, { message: err.message });
        });
      } else {
        console.error("Error submitting form:", error);
        toast({title: "Submission Error", description: "An unexpected error occurred.", variant: "destructive"});
      }
    }
  };
  
  const onFormValidationError = (errors: any) => {
    console.error("Form validation errors (argument from RHF):", errors);
    console.error("Current form values:", form.getValues());
    console.error("form.formState.errors from RHF state:", form.formState.errors);
    console.error("form.formState.errors from RHF state (JSON):", JSON.stringify(form.formState.errors, null, 2));
    console.log("form.formState.isValid from RHF state:", form.formState.isValid);

    let errorSummary = "Please check the form fields for errors. ";
    const fieldErrorKeys = Object.keys(form.formState.errors) as Array<keyof ContentFormValues>;
    if (fieldErrorKeys.length > 0) {
      errorSummary += fieldErrorKeys.map(key => `${key}: ${form.formState.errors[key]?.message}`).join(', ') + ".";
    } else {
      errorSummary = "An unknown validation error occurred. Please check console.";
    }
    toast({
      title: "Validation Error",
      description: errorSummary,
      variant: "destructive"
    });
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
            {/* Common Fields */}
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
                  <FormLabel>Subtitle / Artist (Optional)</FormLabel>
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
                  <FormLabel>Category (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || 'Music'}>
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
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Audio Specific Field (Optional) */}
            <FormField
              control={form.control}
              name="audioSrc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audio URL (Optional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/audio.mp3" {...field} className="bg-input text-foreground border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Article Specific Fields (Optional) */}
            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Excerpt (Optional)</FormLabel>
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
                  <FormLabel>Full Body Content (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Write the full article content here..." {...field} className="bg-input text-foreground border-border min-h-[200px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="sticky bottom-0 bg-card py-4 mt-auto">
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

