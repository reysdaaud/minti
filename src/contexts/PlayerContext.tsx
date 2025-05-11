'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export interface Track {
  id: string;
  title: string;
  artist?: string;
  imageUrl: string;
  audioSrc: string; // URL or path to the audio file
  dataAiHint: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  setCurrentTrack: (track: Track) => void;
  togglePlayPause: () => void;
  isPlayerOpen: boolean;
  setIsPlayerOpen: (isOpen: boolean) => void;
  audioElementRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrackState] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio element only once
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audioElement = audioRef.current;

    const handleTrackEnd = () => setIsPlaying(false);
    
    const handleError = (e: Event) => {
      if (audioElement && audioElement.error) {
        console.error('Audio Player Error Code:', audioElement.error.code);
        console.error('Audio Player Error Message:', audioElement.error.message);
        // MediaError codes:
        // 1: MEDIA_ERR_ABORTED - fetching process aborted by user
        // 2: MEDIA_ERR_NETWORK - error occurred while downloading
        // 3: MEDIA_ERR_DECODE - error occurred while decoding
        // 4: MEDIA_ERR_SRC_NOT_SUPPORTED - audio/video not supported
      } else {
        console.error('Audio Player Error (unknown details):', e);
      }
      setIsPlaying(false); // Stop playback attempts on error
    };

    const handleLoadedData = () => {
      if (isPlaying && audioElement.src && audioElement.src !== 'about:blank') {
        audioElement.play().catch(playError => {
          console.error("Error attempting to play audio on loadeddata:", playError);
          // If autoplay fails (e.g., browser policy), set isPlaying to false
          if (playError.name === 'NotAllowedError' || playError.name === 'NotSupportedError') {
            setIsPlaying(false);
          }
        });
      }
    };
    
    const handleCanPlay = () => {
        // This event fires when the browser can start playing the media.
        // You might want to trigger play here if isPlaying is true and it hasn't started yet.
        if (isPlaying && audioElement.paused && audioElement.src && audioElement.src !== 'about:blank') {
             audioElement.play().catch(playError => {
                console.error("Error attempting to play audio on canplay:", playError);
                if (playError.name === 'NotAllowedError' || playError.name === 'NotSupportedError') {
                    setIsPlaying(false);
                }
            });
        }
    };

    audioElement.addEventListener('ended', handleTrackEnd);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('loadeddata', handleLoadedData);
    audioElement.addEventListener('canplay', handleCanPlay);


    return () => {
      // Cleanup: remove event listeners
      // Note: audioElement.pause() and src='' are handled in track/isPlaying effects
      audioElement.removeEventListener('ended', handleTrackEnd);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('loadeddata', handleLoadedData);
      audioElement.removeEventListener('canplay', handleCanPlay);
    };
  }, [isPlaying]); // Re-attach listeners if isPlaying changes, to ensure handleLoadedData/handleCanPlay have current isPlaying state

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (currentTrack && currentTrack.audioSrc) {
      if (audioElement.src !== currentTrack.audioSrc) {
        audioElement.src = currentTrack.audioSrc;
        audioElement.load(); // Load the new source
      }
      // Play/pause logic is handled by the isPlaying effect
    } else {
      audioElement.pause();
      audioElement.src = '';
      if (isPlaying) setIsPlaying(false); // Ensure isPlaying is false if no track
    }
  }, [currentTrack, isPlaying]); // isPlaying added to ensure reset if track becomes null while playing

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !currentTrack) {
        if (isPlaying) setIsPlaying(false); // If no track, cannot be playing
        return;
    }

    if (isPlaying) {
      // Check if src is valid and media is ready (or likely to be soon)
      if (audioElement.src && audioElement.src !== 'about:blank') {
        // Attempt to play. Browser might block if no user interaction or if media not ready.
        // The 'canplay' and 'loadeddata' listeners will also attempt to play if isPlaying is true.
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error attempting to play audio in isPlaying effect:", error);
            // Common errors: NotAllowedError (autoplay policy), NotSupportedError
            // Set isPlaying to false if autoplay is disallowed.
             if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
                setIsPlaying(false);
             }
          });
        }
      }
    } else {
      audioElement.pause();
    }
  }, [isPlaying, currentTrack]);


  const setCurrentTrackCb = useCallback((track: Track) => {
    setCurrentTrackState(track);
    setIsPlaying(true); 
  }, []);

  const togglePlayPauseCb = useCallback(() => {
    if (currentTrack) { 
      setIsPlaying((prevIsPlaying) => !prevIsPlaying);
    } else {
      setIsPlaying(false);
    }
  }, [currentTrack]);

  return (
    <PlayerContext.Provider 
        value={{ 
            currentTrack, 
            isPlaying, 
            setCurrentTrack: setCurrentTrackCb, 
            togglePlayPause: togglePlayPauseCb, 
            isPlayerOpen, 
            setIsPlayerOpen,
            audioElementRef: audioRef 
        }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
