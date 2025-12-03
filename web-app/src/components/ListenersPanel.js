import React, { useState } from "react";
import "./ListenersPanel.css";

const ListenersPanel = ({ listeners }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`listeners-panel ${isExpanded ? "expanded" : "collapsed"}`}>
      <div className="panel-handle" onClick={toggleExpand}>
        <div className="handle-bar"></div>
        <span className="panel-title">
          Nearby Listeners ({listeners.length})
        </span>
      </div>

      <div className="panel-content">
        {listeners.map((listener) => (
          <div key={listener.id} className="listener-card">
            <img
              src={listener.track.albumArt}
              alt={listener.track.album}
              className="card-album-art"
            />
            <div className="card-info">
              <div className="card-track">{listener.track.name}</div>
              <div className="card-artist">{listener.track.artist}</div>
              <div className="card-meta">
                <span className="card-user">{listener.displayName}</span>
                <span className="card-location">
                  {" "}
                  • {listener.location.city}
                </span>
              </div>
            </div>
            <div className="card-action">
              <button className="play-btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  width="21"
                  height="21"
                  className="size-6"
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
        ))}
      </div>
    </div>
  );
};

export default ListenersPanel;
