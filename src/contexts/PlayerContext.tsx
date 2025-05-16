
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

  const audioLoadedDataHandler = useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isPlaying && audioElement.src && audioElement.src !== window.location.href && !audioElement.src.startsWith('blob:')) {
      audioElement.play().catch(playError => {
        console.error("Error attempting to play audio on loadeddata:", playError, "for src:", audioElement.currentSrc);
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
            console.error("Error attempting to play audio on canplay:", playError, "for src:", audioElement.currentSrc);
            if (playError.name === 'NotAllowedError' || playError.name === 'NotSupportedError') {
                setIsPlaying(false);
            }
        });
    }
  }, [isPlaying]);


  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audioElement = audioRef.current;

    const handleTrackEnd = () => {
        setIsPlaying(false);
         if (navigator.mediaSession) {
          navigator.mediaSession.playbackState = 'paused';
        }
    }
    
    const handleError = (e: Event) => {
      if (audioElement && audioElement.error) {
        console.error('Audio Player Error Code:', audioElement.error.code, 'for src:', audioElement.currentSrc);
        console.error('Audio Player Error Message:', audioElement.error.message || "No specific message.");
      } else {
        console.error('Audio Player Error (unknown details or error object missing):', e, 'for src:', audioElement?.currentSrc);
      }
      setIsPlaying(false);
      if (navigator.mediaSession) {
        navigator.mediaSession.playbackState = 'paused';
      }
    };

    audioElement.addEventListener('ended', handleTrackEnd);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('loadeddata', audioLoadedDataHandler);
    audioElement.addEventListener('canplay', audioCanPlayHandler);


    return () => {
      audioElement.removeEventListener('ended', handleTrackEnd);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('loadeddata', audioLoadedDataHandler);
      audioElement.removeEventListener('canplay', audioCanPlayHandler);
    };
  }, [audioLoadedDataHandler, audioCanPlayHandler]);


  const togglePlayPauseCb = useCallback(() => {
    if (currentTrack) { 
      setIsPlaying((prevIsPlaying) => !prevIsPlaying);
    } else {
      setIsPlaying(false); 
    }
  }, [currentTrack]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) { 
        if (isPlaying) setIsPlaying(false);
        return;
    }

    if (!currentTrack || !currentTrack.audioSrc) {
        audioElement.pause();
        if (audioElement.src && audioElement.src !== "" && audioElement.src !== window.location.href && !audioElement.src.startsWith('blob:')) {
            audioElement.src = ""; 
        }
        if (isPlaying) setIsPlaying(false);
        if (navigator.mediaSession) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = 'none';
        }
        return;
    }

    if (audioElement.src !== currentTrack.audioSrc) {
        audioElement.src = currentTrack.audioSrc;
        audioElement.load(); 
    }

    if (isPlaying) {
      if (audioElement.src && audioElement.src !== window.location.href && !audioElement.src.startsWith('blob:')) {
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error attempting to play audio in isPlaying/currentTrack effect:", error, "for src:", audioElement.currentSrc);
            if (audioElement.error) { 
                console.error(`Audio Element Error details: code ${audioElement.error.code}, message: ${audioElement.error.message || "No specific message."}`);
            }
            setIsPlaying(false);
          });
        }
      } else if (!audioElement.src || audioElement.src === window.location.href || audioElement.src.startsWith('blob:')) {
        if (isPlaying) setIsPlaying(false);
      }
    } else {
      audioElement.pause();
    }

    // Media Session API Integration
    if (navigator.mediaSession) {
      if (currentTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist || 'Unknown Artist',
          album: currentTrack.artist || currentTrack.title, // Or a generic app name like "KeyFind Player"
          artwork: [
            { src: currentTrack.imageUrl, sizes: '96x96', type: 'image/jpeg' }, // Common types, adjust if necessary
            { src: currentTrack.imageUrl, sizes: '128x128', type: 'image/jpeg' },
            { src: currentTrack.imageUrl, sizes: '192x192', type: 'image/jpeg' },
            { src: currentTrack.imageUrl, sizes: '256x256', type: 'image/jpeg' },
            { src: currentTrack.imageUrl, sizes: '384x384', type: 'image/jpeg' },
            { src: currentTrack.imageUrl, sizes: '512x512', type: 'image/jpeg' },
          ]
        });
      }
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }

  }, [isPlaying, currentTrack]);

  // Setup Media Session action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return;
    }

    navigator.mediaSession.setActionHandler('play', () => togglePlayPauseCb());
    navigator.mediaSession.setActionHandler('pause', () => togglePlayPauseCb());

    navigator.mediaSession.setActionHandler('seekbackward', () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
      }
    });
    navigator.mediaSession.setActionHandler('seekforward', () => {
      if (audioRef.current) {
        const duration = audioRef.current.duration;
        if (duration) {
            audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
        }
      }
    });

    // Optional: Add previoustrack and nexttrack if you have playlist logic
    // navigator.mediaSession.setActionHandler('previoustrack', () => { /* ... */ });
    // navigator.mediaSession.setActionHandler('nexttrack', () => { /* ... */ });

    return () => {
      // Clean up action handlers when component unmounts or context changes
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      // navigator.mediaSession.setActionHandler('previoustrack', null);
      // navigator.mediaSession.setActionHandler('nexttrack', null);
    };
  }, [togglePlayPauseCb]);


  const setCurrentTrackCb = useCallback((track: Track) => {
    setCurrentTrackState(track);
    setIsPlaying(true); 
  }, []);


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
