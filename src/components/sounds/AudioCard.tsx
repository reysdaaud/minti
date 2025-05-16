
// src/components/sounds/AudioCard.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/contexts/PlayerContext';
import type { ContentItem } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { Heart, Bookmark, PlayIcon, PauseIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toggleLikeContent, toggleSaveContent } from '@/lib/userInteractions';
import { useToast } from '@/hooks/use-toast';
import { checkAndGrantContentAccess } from '@/lib/contentAccess';


interface AudioCardProps {
  audioItem: ContentItem;
}

const AudioCard: FC<AudioCardProps> = ({ audioItem }) => {
  const { setCurrentTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const isCurrentlyPlayingThisTrack = currentTrack?.id === audioItem.id && isPlaying;

  const handlePlayPause = async () => {
    if (!user || !userProfile) {
      toast({ title: "Authentication Required", description: "Please sign in to play content.", variant: "destructive" });
      return;
    }

    if (isCurrentlyPlayingThisTrack) {
      togglePlayPause();
    } else {
      if (audioItem.audioSrc) {
        const accessResult = await checkAndGrantContentAccess(audioItem.id, user.uid, userProfile);
        if (accessResult.granted) {
          setCurrentTrack({
            id: audioItem.id,
            title: audioItem.title,
            artist: audioItem.subtitle,
            imageUrl: audioItem.imageUrl,
            audioSrc: audioItem.audioSrc,
            dataAiHint: audioItem.dataAiHint,
          });
          if (accessResult.message && (accessResult.title !== "Access Granted" && accessResult.title !== "Previously accessed content.")) { 
             toast({ title: accessResult.title || "Playback Started", description: accessResult.message });
          }
          if (accessResult.coinsDeducted || accessResult.freeAccessGranted) { 
            if (refreshUserProfile) await refreshUserProfile(); 
          }
        } else {
          toast({
            title: accessResult.title || "Access Denied",
            description: accessResult.message || "You do not have access to this item.",
            variant: "destructive",
          });
        }
      } else {
          toast({
              title: "Audio Not Available",
              description: "This item does not have an audio source.",
              variant: "destructive",
          });
      }
    }
  };

  const handleLike = async () => {
    if (!user || !userProfile) {
      toast({ title: "Authentication Required", description: "Please sign in to like content.", variant: "destructive" });
      return;
    }
    try {
      const currentlyLiked = userProfile.likedContentIds?.includes(audioItem.id);
      await toggleLikeContent(user.uid, audioItem.id);
      if (refreshUserProfile) await refreshUserProfile(); 
      toast({ title: currentlyLiked ? "Unliked" : "Liked", description: `"${audioItem.title}" ${currentlyLiked ? 'removed from' : 'added to'} liked songs.`});
    } catch (error) {
      console.error("Failed to toggle like:", error);
      toast({ title: "Error", description: "Could not update like status.", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!user || !userProfile) {
      toast({ title: "Authentication Required", description: "Please sign in to save content.", variant: "destructive" });
      return;
    }
    try {
      const currentlySaved = userProfile.savedContentIds?.includes(audioItem.id);
      await toggleSaveContent(user.uid, audioItem.id);
      if (refreshUserProfile) await refreshUserProfile();
      toast({ title: currentlySaved ? "Unsaved" : "Saved", description: `"${audioItem.title}" ${currentlySaved ? 'removed from' : 'added to'} your library.`});
    } catch (error) {
      console.error("Failed to toggle save:", error);
      toast({ title: "Error", description: "Could not update save status.", variant: "destructive" });
    }
  };

  const isLiked = userProfile?.likedContentIds?.includes(audioItem.id);
  const isSaved = userProfile?.savedContentIds?.includes(audioItem.id);

  return (
    <div
      className="min-w-[180px] md:min-w-[200px] w-[180px] md:w-[200px] flex-shrink-0 snap-start group bg-card p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out"
    >
      <div className="relative w-full aspect-square overflow-hidden rounded-md mb-3 group-hover:opacity-80 transition-opacity">
        <Image
          src={audioItem.imageUrl || `https://placehold.co/300x300.png`}
          alt={audioItem.title}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={audioItem.dataAiHint || "track image"}
        />
        <Button
            onClick={handlePlayPause}
            variant="ghost"
            size="icon"
            className={`absolute bottom-2 right-2 bg-primary/80 hover:bg-primary text-primary-foreground rounded-full w-10 h-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-75 ${isCurrentlyPlayingThisTrack ? 'opacity-100 scale-100' : ''}`}
            aria-label={isCurrentlyPlayingThisTrack ? `Pause ${audioItem.title}` : `Play ${audioItem.title}`}
        >
            {isCurrentlyPlayingThisTrack ? <PauseIcon className="h-5 w-5 fill-primary-foreground" /> : <PlayIcon className="h-5 w-5" />}
        </Button>
      </div>
      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors" title={audioItem.title}>
        {audioItem.title}
      </p>
      {audioItem.subtitle && (
        <p className="text-xs text-muted-foreground truncate" title={audioItem.subtitle}>
          {audioItem.subtitle}
        </p>
      )}
      <div className="mt-2 flex items-center justify-start space-x-2">
        <Button variant="ghost" size="icon" onClick={handleLike} className="p-1 h-auto w-auto text-muted-foreground hover:text-primary" aria-label="Like">
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary text-primary' : ''}`} />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleSave} className="p-1 h-auto w-auto text-muted-foreground hover:text-primary" aria-label="Save">
          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default AudioCard;

