// src/components/player/FullScreenPlayer.tsx
'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ChevronDown,
  MoreVertical,
  Heart,
  PlusCircle,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  LaptopMinimal,
  Share2,
  ListMusic,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/contexts/PlayerContext';

const FullScreenPlayer: FC = () => {
  const { currentTrack, isPlaying, togglePlayPause, setIsPlayerOpen, audioElementRef } = usePlayer();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false); // Mock state for like button

  useEffect(() => {
    const audio = audioElementRef.current;
    if (audio) {
      const updateTimes = () => {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration || 0);
      };
      const handleLoadedMetadata = () => {
        setDuration(audio.duration || 0);
        setCurrentTime(audio.currentTime || 0);
      };

      audio.addEventListener('timeupdate', updateTimes);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      // Initial update if metadata is already loaded
      if (audio.readyState >= audio.HAVE_METADATA) {
        handleLoadedMetadata();
      }
       // Initial update for current time if data is available
      if (audio.readyState >= audio.HAVE_CURRENT_DATA) {
        updateTimes();
      }


      return () => {
        audio.removeEventListener('timeupdate', updateTimes);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [audioElementRef, currentTrack]);


  if (!currentTrack) {
    return null;
  }

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds === Infinity || timeInSeconds < 0) {
      return '0:00';
    }
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleProgressChange = (value: number[]) => {
    if (audioElementRef.current && duration > 0) {
      const newTime = value[0];
      audioElementRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    // In a real app, you'd also update this in your backend/state management
    // For example, add/remove from a user's liked songs list in Firestore
  };


  return (
    <div className="fixed inset-0 bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900 text-white flex flex-col z-[100] p-4 pt-8 md:p-6 md:pt-10 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0 px-2">
        <Button variant="ghost" size="icon" onClick={() => setIsPlayerOpen(false)} className="text-white hover:bg-white/10">
          <ChevronDown className="w-7 h-7" />
        </Button>
        <div className="text-center">
          <p className="text-xs uppercase text-neutral-400">Playing from Playlist</p>
          <p className="text-sm font-semibold">{currentTrack.artist || 'Library'}</p> {/* Placeholder for playlist name */}
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <MoreVertical className="w-6 h-6" />
        </Button>
      </div>

      {/* Album Art */}
      <div className="flex-shrink-0 w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square mx-auto my-4 shadow-2xl rounded-lg overflow-hidden">
        <Image
          src={currentTrack.imageUrl}
          alt={`${currentTrack.title} album art`}
          width={500}
          height={500}
          className="object-cover w-full h-full"
          data-ai-hint={currentTrack.dataAiHint || "album art"}
          priority
        />
      </div>

      {/* Song Info & Like/Add */}
      <div className="my-4 px-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold truncate">{currentTrack.title}</h2>
            <p className="text-neutral-300 truncate">{currentTrack.artist || 'Unknown Artist'}</p>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4 ml-2">
            <Button variant="ghost" size="icon" onClick={handleLike} className={`text-white hover:bg-white/10 p-1 ${isLiked ? 'text-primary' : ''}`}>
              <Heart className={`w-6 h-6 sm:w-7 sm:h-7 ${isLiked ? 'fill-current text-primary' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 p-1">
              <PlusCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="my-4 px-2 flex-shrink-0">
        <Slider
          value={[currentTime]}
          max={duration > 0 ? duration : 100}
          step={0.1}
          onValueChange={handleProgressChange}
          className="w-full [&>span:first-child>span]:bg-white [&>span:last-child]:bg-white [&>span:last-child]:h-3 [&>span:last-child]:w-3 [&>span:first-child]:h-1"
          disabled={duration === 0}
        />
        <div className="flex justify-between text-xs text-neutral-400 mt-1.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex items-center justify-around my-4 px-2 flex-shrink-0">
        <Button variant="ghost" size="icon" className="text-white hover:text-neutral-300">
          <Shuffle className="w-6 h-6 md:w-7 md:h-7" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:text-neutral-300">
          <SkipBack className="w-8 h-8 md:w-10 md:h-10 fill-white" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayPause}
          className="bg-white text-black rounded-full w-20 h-20 md:w-24 md:h-24 hover:bg-neutral-200 transform hover:scale-105 flex items-center justify-center"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-10 h-10 md:w-12 md:h-12 fill-black" /> : <Play className="w-10 h-10 md:w-12 md:h-12 fill-black ml-1" />}
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:text-neutral-300">
          <SkipForward className="w-8 h-8 md:w-10 md:h-10 fill-white" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:text-neutral-300">
          <Repeat className="w-6 h-6 md:w-7 md:h-7" />
        </Button>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between text-neutral-300 px-4 mt-auto mb-2 flex-shrink-0">
        <Button variant="ghost" size="icon" className="hover:text-white">
          <LaptopMinimal className="w-5 h-5 md:w-6 md:h-6" />
        </Button>
        <div className="flex items-center space-x-6">
          <Button variant="ghost" size="icon" className="hover:text-white">
            <Share2 className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:text-white">
            <ListMusic className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </div>
      </div>
      
       {currentTrack.artist && (
        <div className="px-2 text-center flex-shrink-0 mb-2">
          <Button
            variant="outline"
            className="rounded-full border-neutral-500 text-white hover:border-white hover:bg-white/5 px-5 py-2 text-sm font-semibold"
          >
            Explore {currentTrack.artist}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FullScreenPlayer;
