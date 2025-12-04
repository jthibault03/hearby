import React, { useRef, useEffect } from "react";
import "./CurrentTrack.css";

function CurrentTrack({ track, isPlaying, onPlayPause, onShowSameSong }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.log("Playback prevented:", err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, track]);

  if (!track) {
    return null;
  }

  return (
    <div className="current-track">
      <div className="track-info">
        <img
          src={track.albumArt}
          alt={track.name}
          className="track-album-art"
        />
        <div className="track-details">
          <div className="track-name">{track.name}</div>
          <div className="track-artist">{track.artist}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="same-song-btn"
            onClick={onShowSameSong}
            title="See who's listening to the same song"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '20px',
              padding: '8px 16px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <span>🎵</span>
            <span>Same Song</span>
          </button>
          <button
            className="track-play-btn"
            onClick={onPlayPause}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isPlaying ? (
              <div className="playing-indicator">
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
              </div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="white"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
      {track.audioUrl && (
        <audio ref={audioRef} src={track.audioUrl} loop />
      )}
    </div>
  );
}

export default CurrentTrack;
