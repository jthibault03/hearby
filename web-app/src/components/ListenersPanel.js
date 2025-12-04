import React, { useState, useRef, useEffect, useCallback } from "react";
import "./ListenersPanel.css";
import { getSongById } from "../services/mockSongData";

const ListenersPanel = ({ listeners, onTrackSelect }) => {
  const [listHeight, setListHeight] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const snapToClosest = useCallback((height) => {
    const snapPoints = [15, 50, 75];
    const closest = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - height) < Math.abs(prev - height) ? curr : prev
    );
    setListHeight(closest);
  }, []);

  const handleStart = (clientY) => {
    setIsDragging(true);
    startY.current = clientY;
    startHeight.current = listHeight;
  };

  const handleMove = useCallback(
    (clientY) => {
      if (!isDragging) return;
      const deltaY = startY.current - clientY;
      const windowHeight = window.innerHeight - 64;
      const deltaPercent = (deltaY / windowHeight) * 100;
      const newHeight = Math.max(
        10,
        Math.min(75, startHeight.current + deltaPercent)
      );
      setListHeight(newHeight);
    },
    [isDragging]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    snapToClosest(listHeight);
  }, [listHeight, snapToClosest]);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e) => {
      e.preventDefault();
      handleMove(e.clientY);
    };

    const onMouseUp = (e) => {
      e.preventDefault();
      handleEnd();
    };

    document.addEventListener("mousemove", onMouseMove, { passive: false });
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  const listenerCards = listeners.map((listener) => {
    const track = getSongById(listener.trackId) || {};

    return (
      <div key={listener.id} className="listener-card">
        <img src={track.albumArt} alt={track.name} className="card-album-art" />
        <div className="card-info">
          <div className="card-track">{track.name}</div>
          <div className="card-artist">{track.artist}</div>
          <div className="card-meta">
            <span className="card-user">
              {listener.isFriend ? listener.displayName : "Nearby User"}
            </span>
            <span className="card-location"> • {listener.location.city}</span>
          </div>
        </div>
        <div className="card-action">
          <button className="play-btn" onClick={() => onTrackSelect(track)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              width="21"
              height="21"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  });

  return (
    <div
      className={`listeners-panel ${isDragging ? "dragging" : ""}`}
      style={{
        height: listHeight <= 15 ? "138px" : `${listHeight}vh`,
      }}
    >
      <div
        className="panel-handle"
        onTouchStart={(e) => handleStart(e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientY)}
      >
        <div className="handle-bar"></div>
        <span className="panel-title">
          Nearby Listeners ({listeners.length})
        </span>
      </div>

      {listHeight > 15 && (
        <div className="panel-content">
          {listenerCards}
        </div>
      )}
    </div>
  );
};

export default ListenersPanel;
