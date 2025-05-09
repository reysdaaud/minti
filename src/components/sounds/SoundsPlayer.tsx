// src/components/sounds/SoundsPlayer.tsx
'use client';

import type { FC } from 'react';
import { Play, Pause } from 'lucide-react';
import styles from './SoundsPlayer.module.css';
import Image from 'next/image';

// Placeholder SVG for Rewind 10s icon
const Rewind10Icon: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10 17a5 5 0 1 0 0-10H6"/>
    <path d="m10 7-4 4 4 4"/>
    <text x="12" y="13.5" fontSize="8" fill="currentColor" textAnchor="middle" dominantBaseline="middle">10</text>
  </svg>
);

// Placeholder SVG for Forward 10s icon
const Forward10Icon: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 17a5 5 0 1 1 0-10h4"/>
    <path d="m14 7 4 4-4 4"/>
    <text x="10" y="13.5" fontSize="8" fill="currentColor" textAnchor="middle" dominantBaseline="middle">10</text>
  </svg>
);


const SoundsPlayer: FC = () => {
  const isPlaying = false;
  const progress = 30; // Example progress percentage

  const handlePlayPause = () => console.log('Play/Pause clicked');
  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    // Basic seek logic placeholder
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
        {/* Live indicator removed as per request */}
      </div>

      <div className={styles.controls}>
        <button className={styles.controlButton} onClick={() => handleControlClick('Rewind 10s')} aria-label="Rewind 10 seconds">
          <Rewind10Icon className={styles.customIcon} />
          <span className={styles.controlLabel}>Rewind</span>
        </button>
        <button className={`${styles.controlButton} ${styles.playPauseButton}`} onClick={handlePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={36} /> : <Play size={36} />}
        </button>
        <button className={styles.controlButton} onClick={() => handleControlClick('Forward 10s')} aria-label="Forward 10 seconds">
          <Forward10Icon className={styles.customIcon} />
          <span className={styles.controlLabel}>Forward</span>
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
