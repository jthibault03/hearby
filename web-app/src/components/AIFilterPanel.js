import React, { useState, useMemo } from "react";
import "./AIFilterPanel.css";
import songData from "../services/mockSongData.generated.json";

const AIFilterPanel = ({ listeners, onClose, onTrackSelect }) => {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [sentimentSort, setSentimentSort] = useState("neutral"); // neutral, happy, sad

  // Extract unique genres
  const genres = useMemo(() => {
    const genreSet = new Set();
    listeners.forEach((listener) => {
      const track = songData[listener.trackId];
      if (track?.genres) {
        track.genres.forEach((g) => genreSet.add(g));
      }
    });
    return Array.from(genreSet).sort();
  }, [listeners]);

  // Filter listeners by selected genre and sort by sentiment
  const filteredListeners = useMemo(() => {
    if (!selectedGenre) return [];

    let filtered = listeners.filter((listener) => {
      const track = songData[listener.trackId];
      return track?.genres?.includes(selectedGenre);
    });

    // Sort based on sentiment
    if (sentimentSort === "happy") {
      // Sort by sentiment (highest first), but keep friends at top
      const friends = filtered
        .filter((l) => l.isFriend)
        .sort(
          (a, b) =>
            (songData[b.trackId]?.sentiment_analysis || 0) -
            (songData[a.trackId]?.sentiment_analysis || 0)
        );
      const nonFriends = filtered
        .filter((l) => !l.isFriend)
        .sort(
          (a, b) =>
            (songData[b.trackId]?.sentiment_analysis || 0) -
            (songData[a.trackId]?.sentiment_analysis || 0)
        );
      return [...friends, ...nonFriends];
    } else if (sentimentSort === "sad") {
      // Sort by sentiment (lowest first), but keep friends at top
      const friends = filtered
        .filter((l) => l.isFriend)
        .sort(
          (a, b) =>
            (songData[a.trackId]?.sentiment_analysis || 0) -
            (songData[b.trackId]?.sentiment_analysis || 0)
        );
      const nonFriends = filtered
        .filter((l) => !l.isFriend)
        .sort(
          (a, b) =>
            (songData[a.trackId]?.sentiment_analysis || 0) -
            (songData[b.trackId]?.sentiment_analysis || 0)
        );
      return [...friends, ...nonFriends];
    } else {
      // neutral: friends first, then others
      const friends = filtered.filter((l) => l.isFriend);
      const nonFriends = filtered.filter((l) => !l.isFriend);
      return [...friends, ...nonFriends];
    }
  }, [selectedGenre, listeners, sentimentSort]);

  const cycleSentimentSort = () => {
    if (sentimentSort === "neutral") {
      setSentimentSort("happy");
    } else if (sentimentSort === "happy") {
      setSentimentSort("sad");
    } else {
      setSentimentSort("neutral");
    }
  };

  const getSentimentIcon = () => {
    if (sentimentSort === "happy") return "↑";
    if (sentimentSort === "sad") return "↓";
    return "−";
  };

  return (
    <div className="ai-filter-overlay">
      <div className="ai-filter-panel">
        <div className="ai-filter-header">
          <h2>AI Filter</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="genre-tabs">
          {genres.map((genre) => (
            <button
              key={genre}
              className={`genre-tab ${selectedGenre === genre ? "active" : ""}`}
              onClick={() => {
                setSelectedGenre(genre);
                setSentimentSort("neutral");
              }}
            >
              {genre}
            </button>
          ))}
        </div>

        {selectedGenre && (
          <>
            <div className="sentiment-controls">
              <span className="sentiment-label">Sort by sentiment:</span>
              <button className="sentiment-btn" onClick={cycleSentimentSort}>
                {getSentimentIcon()}
              </button>
            </div>

            <div className="filtered-listeners">
              {filteredListeners.length === 0 ? (
                <div className="no-listeners">
                  No listeners found for {selectedGenre}
                </div>
              ) : (
                filteredListeners.map((listener) => {
                  const track = songData[listener.trackId];
                  const sentiment = track?.sentiment_analysis;
                  return (
                    <div key={listener.id} className="listener-card">
                      <img
                        src={track?.albumArt}
                        alt={track?.album}
                        className="card-album-art"
                      />
                      <div className="card-info">
                        <div className="card-track">{track?.name}</div>
                        <div className="card-artist">
                          {Array.isArray(track?.artist)
                            ? track.artist.join(", ")
                            : track?.artist}
                        </div>
                      <div className="card-meta">
                        <span className="card-user">
                          {listener.isFriend ? listener.displayName : "Nearby User"}
                          {listener.isFriend && (
                            <span className="friend-badge">Friend</span>
                          )}
                        </span>
                        <span className="card-location"> • {listener.location.city}</span>
                      </div>
                      {sentiment !== undefined && (
                        <div className="card-sentiment">
                          Mood: {Math.round(sentiment * 100)}%
                        </div>
                      )}
                    </div>
                    <div className="card-action">
                      <button
                        className="play-btn"
                        onClick={() => {
                          onTrackSelect(track);
                          onClose();
                        }}
                      >
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
                })
              )}
            </div>
          </>
        )}

        {!selectedGenre && (
          <div className="no-genre-selected">
            Select a genre to see nearby listeners
          </div>
        )}
      </div>
    </div>
  );
};

export default AIFilterPanel;
