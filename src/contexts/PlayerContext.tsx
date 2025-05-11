'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

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

  const setCurrentTrack = useCallback((track: Track) => {
    setCurrentTrackState(track);
    setIsPlaying(true); // Automatically play when a new track is set
  }, []);

  const togglePlayPause = useCallback(() => {
    if (currentTrack) {
      setIsPlaying((prevIsPlaying) => !prevIsPlaying);
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