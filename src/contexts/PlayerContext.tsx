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
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrackState] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    const audioElement = audioRef.current;

    const handleTrackEnd = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('Audio Error:', e);
      setIsPlaying(false);
    };
    const handleLoadedData = () => {
      if (isPlaying && audioElement.src !== 'about:blank' && audioElement.src !== '') { // Check if src is valid
        audioElement.play().catch(e => console.error("Error playing audio on loadeddata:", e));
      }
    };


    audioElement.addEventListener('ended', handleTrackEnd);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('loadeddata', handleLoadedData);


    return () => {
      audioElement.pause();
      audioElement.removeEventListener('ended', handleTrackEnd);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('loadeddata', handleLoadedData);
      // No need to set audioRef.current to null here, as it's managed by the component lifecycle.
    };
  }, []); // Runs once on mount

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      if (currentTrack) {
        if (audioElement.src !== currentTrack.audioSrc) {
          audioElement.src = currentTrack.audioSrc;
          audioElement.load(); // Explicitly load the new source
        }
        // Play/pause logic is handled in the next useEffect
      } else {
        audioElement.pause();
        audioElement.src = ''; // Clear src when no track
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement && currentTrack) { // Only act if there's a track
      if (isPlaying) {
        // Check if src is set before playing. audioSrc might be an empty string initially.
        if (audioElement.src && audioElement.src !== 'about:blank') {
          audioElement.play().catch(e => console.error("Error playing audio:", e));
        }
      } else {
        audioElement.pause();
      }
    } else if (audioElement && !currentTrack) {
      // If no current track, ensure it's paused and reset isPlaying
      audioElement.pause();
      if (isPlaying) setIsPlaying(false);
    }
  }, [isPlaying, currentTrack]);


  const setCurrentTrack = useCallback((track: Track) => {
    setCurrentTrackState(track);
    setIsPlaying(true); // Automatically try to play when a new track is set
  }, []);

  const togglePlayPause = useCallback(() => {
    if (currentTrack) { // Only toggle if there's a track
      setIsPlaying((prevIsPlaying) => !prevIsPlaying);
    } else {
      // If no track, ensure isPlaying is false
      setIsPlaying(false);
    }
  }, [currentTrack]);

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, setCurrentTrack, togglePlayPause, isPlayerOpen, setIsPlayerOpen }}>
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
