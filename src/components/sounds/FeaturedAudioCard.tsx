// src/components/sounds/FeaturedAudioCard.tsx
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { MoreHorizontal, PlayIcon } from 'lucide-react'; // Using PlayIcon directly
import { usePlayer } from '@/contexts/PlayerContext';
import type { ContentItem } from '@/services/contentService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { checkAndGrantContentAccess } from '@/lib/contentAccess';

interface FeaturedAudioCardProps {
  audioItem: ContentItem;
}

const FeaturedAudioCard: FC<FeaturedAudioCardProps> = ({ audioItem }) => {
  const { setCurrentTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const isCurrentlyPlayingThisTrack = currentTrack?.id === audioItem.id && isPlaying;

  const handlePlay = async () => {
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
                imageUrl: audioItem.imageUrl,
                audioSrc: audioItem.audioSrc,
                artist: audioItem.subtitle,
                dataAiHint: audioItem.dataAiHint,
            });
            if (accessResult.message && (accessResult.title !== "Access Granted" && accessResult.title !== "Already Consumed")) {
               toast({ title: accessResult.title || "Playback Started", description: accessResult.message });
            }
             if (accessResult.coinsDeducted || accessResult.freeAccessGranted) {
              await refreshUserProfile();
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

  return (
    <div
      className="bg-neutral-800 hover:bg-neutral-700/80 transition-colors rounded-md flex items-center space-x-3 cursor-pointer shadow-sm group"
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
    >
      <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-l-md overflow-hidden">
        <Image
          src={audioItem.imageUrl || `https://placehold.co/100x100.png`}
          alt={audioItem.title}
          layout="fill"
          objectFit="cover"
          data-ai-hint={audioItem.dataAiHint || "featured audio"}
        />
      </div>
      <div className="flex-grow py-2 pr-2 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{audioItem.title}</p>
        {audioItem.subtitle && <p className="text-xs text-muted-foreground truncate">{audioItem.subtitle}</p>}
      </div>
      <button
        className={`p-2 text-white rounded-full bg-primary/80 hover:bg-primary mr-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 ${isCurrentlyPlayingThisTrack ? '!opacity-100' : ''}`}
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click when clicking button
          handlePlay();
        }}
        aria-label={isCurrentlyPlayingThisTrack ? `Pause ${audioItem.title}` : `Play ${audioItem.title}`}
      >
        {isCurrentlyPlayingThisTrack ? <PauseIcon className="w-5 h-5 fill-primary-foreground" /> : <PlayIcon className="w-5 h-5" />}
      </button>
    </div>
  );
};

// Simple PauseIcon component for completeness
const PauseIcon: FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
  </svg>
);


export default FeaturedAudioCard;
