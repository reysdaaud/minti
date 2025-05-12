// src/app/admin/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import ContentForm from '@/components/admin/ContentForm';
import ContentList from '@/components/admin/ContentList';
import {
  getContentItems,
  addContentItem,
  updateContentItem,
  deleteContentItem,
  type ContentItem,
  type ContentItemData,
} from '@/services/contentService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await getContentItems();
      setContentItems(items);
    } catch (err) {
      console.error('Failed to fetch content items:', err);
      setError('Failed to load content. Please try again.');
      toast({
        title: 'Error',
        description: 'Could not fetch content items.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/signin');
    } else if (user) {
      fetchItems();
    }
  }, [user, authLoading, router, fetchItems]);

  const handleOpenForm = (item?: ContentItem) => {
    setEditingItem(item || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleSubmitForm = async (data: ContentItemData) => {
    setFormSubmitLoading(true);
    try {
      if (editingItem) {
        await updateContentItem(editingItem.id, data);
        toast({ title: 'Success', description: 'Content item updated successfully.' });
      } else {
        await addContentItem(data);
        toast({ title: 'Success', description: 'Content item added successfully.' });
      }
      await fetchItems(); // Refetch items after submission
      handleCloseForm();
    } catch (err) {
      console.error('Failed to save content item:', err);
      toast({
        title: 'Error',
        description: 'Could not save content item.',
        variant: 'destructive',
      });
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeleteLoadingId(itemId);
    try {
      await deleteContentItem(itemId);
      toast({ title: 'Success', description: 'Content item deleted successfully.' });
      setContentItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error('Failed to delete content item:', err);
      toast({
        title: 'Error',
        description: 'Could not delete content item.',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }

  if (!user) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground">Admin Content Management</h1>
        <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Content
        </Button>
      </header>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading content...</p>
        </div>
      )}

      {error && !isLoading && (
         <Card className="border-destructive bg-destructive/10">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" /> Error Loading Content
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive/90">{error}</p>
                <Button onClick={fetchItems} variant="outline" className="mt-4">
                    Try Again
                </Button>
            </CardContent>
         </Card>
      )}

      {!isLoading && !error && (
        <ContentList items={contentItems} onEdit={handleOpenForm} onDelete={handleDeleteItem} isLoadingDelete={deleteLoadingId} />
      )}

      {isFormOpen && (
        <ContentForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          initialData={editingItem}
          isLoading={formSubmitLoading}
        />
      )}
    </div>
  );
}
