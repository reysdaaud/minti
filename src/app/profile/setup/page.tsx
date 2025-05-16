'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function ProfileSetupPage() {
  const { user, loading: authLoading, userProfile, isUserProfileLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/signin');
    } else if (!authLoading && user && !isUserProfileLoading && userProfile) {
      if (userProfile.profileComplete) {
        // If profile is already complete, check preferences
        if (!userProfile.preferredCategories || userProfile.preferredCategories.length === 0) {
          router.replace('/profile/preferences');
        } else {
          router.replace('/'); // Profile and preferences complete, go to dashboard
        }
      } else {
        // Populate form if some data exists (e.g., from Google display name)
        const nameParts = user.displayName?.split(' ') || [];
        setFormData({
          firstName: userProfile.firstName || (nameParts.length > 0 ? nameParts[0] : ''),
          lastName: userProfile.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''),
          mobile: userProfile.mobile || '',
        });
      }
    }
  }, [user, authLoading, userProfile, isUserProfileLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({ title: "Validation Error", description: "First name and last name are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        mobile: formData.mobile.trim(),
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`, // Update main name field too
        profileComplete: true,
        updatedAt: new Date(), // Using client-side date, or serverTimestamp()
      });
      toast({ title: "Profile Updated", description: "Your profile has been saved." });
      router.push('/profile/preferences'); // Proceed to preference selection
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: "Failed to update profile. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isUserProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This case should be handled by the redirect in useEffect, but as a fallback:
    return <div className="min-h-screen flex items-center justify-center bg-background p-4"><p>Redirecting to sign in...</p></div>;
  }
  
  // If profile is complete, useEffect should redirect. If not, show form.
   if (userProfile && userProfile.profileComplete) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading next step...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Complete Your Profile</CardTitle>
          <CardDescription>Tell us a bit more about yourself.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="firstName" className="text-foreground">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="mobile" className="text-foreground">Mobile Number (Optional)</Label>
              <Input
                id="mobile"
                name="mobile"
                type="tel"
                value={formData.mobile}
                onChange={handleChange}
                className="mt-1 bg-input border-border text-foreground"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save and Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
