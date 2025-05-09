// src/components/sounds/SoundsPlayer.tsx
'use client';

import type { FC } from 'react';
import { Play, Pause } from 'lucide-react';
import styles from './SoundsPlayer.module.css';
import Image from 'next/image';

// Custom SVG Icons based on the image provided

const StartOverIcon: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M29.995 13.438A10.001 10.001 0 1 0 26.5 26.5" />
    <path d="M29.999 7.5V13.5H24" />
     <polyline points="13 18 10 15 13 12" />
     <polyline points="13 18 10 15 13 12" transform="translate(2.5 0)" /> 
  </svg>
);

const Rewind20sIcon: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className}>
    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
    <path d="M25 13a9 9 0 1 0-1.83 5.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M25.5 8.5V14.5H19.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <text x="20" y="23" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">20</text>
  </svg>
);

const Forward20sIcon: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className}>
    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
    <path d="M15 13a9 9 0 1 1 1.83 5.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.5 8.5V14.5H20.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <text x="20" y="23" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">20</text>
  </svg>
);

const GoLiveIcon: FC<{ className?: string }> = ({ className }) => (
 <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Reusing StartOverIcon's arrow part for the >> effect */}
    <path d="M29.999 7.5V13.5H24"  transform="translate(-10 0)" /> 
    <path d="M29.999 7.5V13.5H24"  transform="translate(-5 0)" />
    <circle cx="20" cy="20" r="3" fill="currentColor" />
  </svg>
);


const SoundsPlayer: FC = () => {
  const isPlaying = false;
  const progress = 30; // Example progress percentage

  const handlePlayPause = () => console.log('Play/Pause clicked');
  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = event.currentTarget;
    const clickPosition = event.clientX - progressBar.getBoundingClientRect().left;
    const newProgress = (clickPosition / progressBar.offsetWidth) * 100;
    console.log(`Seek to: ${newProgress.toFixed(2)}%`);
  };
  const handleControlClick = (action: string) => console.log(`${action} clicked`);

  return (
    <div className={styles.playerContainer}>
      <div className={styles.albumArtContainer}>
        <Image
          src="https://picsum.photos/seed/radiohead/200/200"
          alt="Radio 1 Dance"
          width={120}
          height={120}
          className={styles.albumArt}
          data-ai-hint="radio dj"
        />
      </div>
      <div className={styles.showInfo}>
        <p className={styles.stationName}>RADIO 1 DANCE</p>
        <div className={styles.orangeBar}></div>
        <h2 className={styles.showTitle}>Radio 1 Dance Morning</h2>
        <p className={styles.showArtist}>with Arielle Free</p>
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressBarHolder} onClick={handleSeek}>
          <div className={styles.progressBarBackground}></div>
          <div className={styles.progressBarFill} style={{ width: `${progress}%` }}>
            <div className={styles.progressThumb}></div>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <button className={styles.controlButton} onClick={() => handleControlClick('Start Over')} aria-label="Start Over">
          <StartOverIcon className={styles.controlIcon} />
          <span className={styles.controlLabelSmall}>START</span>
        </button>
        <button className={styles.controlButton} onClick={() => handleControlClick('Rewind 20s')} aria-label="Rewind 20 seconds">
          <Rewind20sIcon className={styles.controlIcon} />
        </button>
        <button className={`${styles.controlButton} ${styles.playPauseButton}`} onClick={handlePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={36} strokeWidth={2.5} /> : <Play size={36} strokeWidth={2.5} />}
        </button>
        <button className={styles.controlButton} onClick={() => handleControlClick('Forward 20s')} aria-label="Forward 20 seconds">
          <Forward20sIcon className={styles.controlIcon} />
        </button>
        <button className={styles.controlButton} onClick={() => handleControlClick('Go Live')} aria-label="Go Live">
          <GoLiveIcon className={styles.controlIcon} />
          <span className={styles.controlLabelSmall}>LIVE</span>
        </button>
      </div>

      <div className={styles.scheduleInfo}>
        <div className={styles.onAir}>
          <p className={styles.scheduleHeader}><span className={styles.onAirHighlight}>ON AIR:</span> 02:00 - 05:00</p>
          <p className={styles.scheduleTitle}>Radio 1 Dance Morning</p>
        </div>
        <div className={styles.nextUp}>
          <p className={styles.scheduleHeader}><span className={styles.nextHighlight}>NEXT:</span> 05:00 - 06:00</p>
          <p className={styles.scheduleTitle}>Radio 1's Dance Anthems</p>
          <p className={styles.scheduleSubtitle}>Nonstop classic and current dance</p>
        </div>
      </div>
      
      <div className={styles.description}>
        <p>The best new, current and classic dance tracks with Arielle Free. <button className={styles.readMore}>Read more ▼</button></p>
      </div>

      <button className={styles.programmeWebsiteButton}>
        Programme Website 
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
      </button>
    </div>
  );
};

export default SoundsPlayer;
