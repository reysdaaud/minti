
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
    }
    
    const handleError = (e: Event) => {
      // audioElement is already defined in the outer scope of this useEffect
      if (audioElement && audioElement.error) {
        console.error('Audio Player Error Code:', audioElement.error.code, 'for src:', audioElement.currentSrc);
        console.error('Audio Player Error Message:', audioElement.error.message || "No specific message.");
        // MediaError codes:
        // 1: MEDIA_ERR_ABORTED - fetching process aborted by user
        // 2: MEDIA_ERR_NETWORK - network error occurred while fetching
        // 3: MEDIA_ERR_DECODE - error occurred while decoding
        // 4: MEDIA_ERR_SRC_NOT_SUPPORTED - source or format not supported
      } else {
        console.error('Audio Player Error (unknown details or error object missing):', e, 'for src:', audioElement?.currentSrc);
      }
      setIsPlaying(false); 
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
