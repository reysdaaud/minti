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

  // Memoized event handlers that depend on `isPlaying`
  const audioLoadedDataHandler = useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isPlaying && audioElement.src && audioElement.src !== window.location.href && !audioElement.src.startsWith('blob:')) {
      audioElement.play().catch(playError => {
        console.error("Error attempting to play audio on loadeddata:", playError);
        if (playError.name === 'NotAllowedError' || playError.name === 'NotSupportedError') {
          setIsPlaying(false);
        }
      });
    }
  }, [isPlaying]);

  const audioCanPlayHandler = useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isPlaying && audioElement.paused && audioElement.src && audioElement.src !== window.location.href && !audioElement.src.startsWith('blob:')) {
         audioElement.play().catch(playError => {
            console.error("Error attempting to play audio on canplay:", playError);
            if (playError.name === 'NotAllowedError' || playError.name === 'NotSupportedError') {
                setIsPlaying(false);
            }
        });
    }
  }, [isPlaying]);


  useEffect(() => {
    // Initialize audio element only once
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audioElement = audioRef.current; // Safe to assume it's non-null for this effect's scope

    const handleTrackEnd = () => {
        // console.log("Track ended");
        setIsPlaying(false);
    }
    
    const handleError = (e: Event) => {
      if (audioElement && audioElement.error) {
        console.error('Audio Player Error Code:', audioElement.error.code); // MEDIA_ERR_SRC_NOT_SUPPORTED is 4
        console.error('Audio Player Error Message:', audioElement.error.message || "No specific message.");
      } else {
        console.error('Audio Player Error (unknown details or error object missing):', e);
      }
      setIsPlaying(false); // Stop playback attempts on error
    };

    // Add event listeners
    audioElement.addEventListener('ended', handleTrackEnd);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('loadeddata', audioLoadedDataHandler);
    audioElement.addEventListener('canplay', audioCanPlayHandler);


    return () => {
      // Cleanup: remove event listeners
      audioElement.removeEventListener('ended', handleTrackEnd);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('loadeddata', audioLoadedDataHandler);
      audioElement.removeEventListener('canplay', audioCanPlayHandler);
    };
  }, [audioLoadedDataHandler, audioCanPlayHandler]); // Dependencies are memoized handlers


  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) { 
        if (isPlaying) setIsPlaying(false);
        return;
    }

    if (!currentTrack || !currentTrack.audioSrc) {
        audioElement.pause();
        // Only clear src if it was previously set to something meaningful and not already empty
        if (audioElement.src && audioElement.src !== "") { 
            // console.log("Clearing audio source because no current track or src");
            audioElement.src = ""; 
        }
        if (isPlaying) setIsPlaying(false);
        return;
    }

    // If track src is different, update and load it
    if (audioElement.src !== currentTrack.audioSrc) {
        // console.log(`Setting audio source to: ${currentTrack.audioSrc}`);
        audioElement.src = currentTrack.audioSrc;
        audioElement.load(); // Load the new source
    }

    // Handle play/pause based on isPlaying state
    if (isPlaying) {
      // Check if src is valid (not empty or default page URL which some browsers might set)
      if (audioElement.src && audioElement.src !== window.location.href && !audioElement.src.startsWith('blob:')) {
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error attempting to play audio in isPlaying/currentTrack effect:", error);
            if (audioElement.error) { 
                console.error(`Audio Element Error details: code ${audioElement.error.code}, message: ${audioElement.error.message || "No specific message."}`);
            }
            setIsPlaying(false);
          });
        }
      } else if (!audioElement.src || audioElement.src === window.location.href || audioElement.src.startsWith('blob:')) {
        // If src is invalid/empty or a blob URL that hasn't resolved, but we are trying to play, stop.
        // console.log("isPlaying is true, but src is invalid or not ready. Setting isPlaying to false.");
        if (isPlaying) setIsPlaying(false);
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
      setIsPlaying(false); // Cannot play if no track
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

