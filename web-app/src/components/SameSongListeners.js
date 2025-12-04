import React, { useState } from "react";
import "./SameSongListeners.css";
import { getSongById } from "../services/mockSongData";
import MessageModal from "./MessageModal";

function SameSongListeners({ listeners, currentTrack, onClose }) {
  const [selectedUser, setSelectedUser] = useState(null);

  if (!currentTrack) return null;

  const sameSongListeners = listeners.filter((listener) => {
    const track = getSongById(listener.trackId);
    return (
      track && track.name === currentTrack.name && track.artist === currentTrack.artist
    );
  });

  const handleUserClick = (listener) => {
    setSelectedUser(listener);
  };

  const handleCloseMessage = () => {
    setSelectedUser(null);
  };

  return (
    <>
      <div className="same-song-overlay" onClick={onClose}>
        <div
          className="same-song-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="same-song-header">
            <h2>🎵 Listening to the same song</h2>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="same-song-track-info">
            <img
              src={currentTrack.albumArt}
              alt={currentTrack.name}
              className="track-thumbnail"
            />
            <div>
              <div className="track-name-modal">{currentTrack.name}</div>
              <div className="track-artist-modal">{currentTrack.artist}</div>
            </div>
          </div>

          <div className="same-song-count">
            {sameSongListeners.length === 0
              ? "No one else is listening to this song right now"
              : `${sameSongListeners.length} ${
                  sameSongListeners.length === 1 ? "person is" : "people are"
                } vibing to this`}
          </div>

          <div className="same-song-list">
            {sameSongListeners.map((listener) => (
              <div
                key={listener.id}
                className="same-song-user"
                onClick={() => handleUserClick(listener)}
              >
                <div
                  className="user-avatar"
                  style={{
                    backgroundImage: `url(https://i.pravatar.cc/150?u=${listener.username})`,
                  }}
                ></div>
                <div className="user-details">
                  <div className="user-name">
                    {listener.isFriend
                      ? listener.displayName
                      : "Nearby Listener"}
                    {listener.isFriend && (
                      <span className="friend-badge">Friend</span>
                    )}
                  </div>
                  <div className="user-location">{listener.location.city}</div>
                </div>
                <button className="message-btn">💬</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedUser && (
        <MessageModal
          user={selectedUser}
          track={currentTrack}
          onClose={handleCloseMessage}
        />
      )}
    </>
  );
}

export default SameSongListeners;
