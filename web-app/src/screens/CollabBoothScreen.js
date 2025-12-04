import React, { useState } from "react";
import boothManager from "../services/BoothManager";
import "./CollabBoothScreen.css";

const CollabBoothScreen = ({ onBack }) => {
  const [booths, setBooths] = useState(boothManager.getAllBooths());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoothName, setNewBoothName] = useState("");

  const handleCreateBooth = async () => {
    await boothManager.createBooth(newBoothName);
    setBooths([...boothManager.getAllBooths()]);
    setShowCreateModal(false);
    setNewBoothName("");
  };

  const handleJoinBooth = (boothId) => {
    boothManager.joinBooth(boothId);
    setBooths([...boothManager.getAllBooths()]);
  };

  return (
    <div className="collab-screen">
      <div className="collab-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <button
          className="create-room-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + New Room
        </button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Booth</h2>
            <input
              type="text"
              placeholder="Enter booth name..."
              value={newBoothName}
              onChange={(e) => setNewBoothName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleCreateBooth();
                }
              }}
            />
            <div className="modal-buttons">
              <button onClick={handleCreateBooth}>Create</button>
              <button onClick={() => setShowCreateModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="rooms-list">
        <h1>Collab Booths</h1>
        {booths.map((room) => (
          <div key={room.id} className="room-card">
            <div className="room-info">
              <h2>{room.name}</h2>
              <div className="participants-row">
                <div className="participant-avatars">
                  {room.members?.slice(0, 3).map((member) => (
                    <div key={member.id} className="participant-avatar" title={member.displayName}>
                      <img
                        src={`https://i.pravatar.cc/100?u=${member.id}`}
                        alt={member.displayName}
                      />
                    </div>
                  ))}
                </div>
                <span className="participants">
                  {room.participants} listening
                </span>
                <button className="add-user-btn" title="Add User">
                  +
                </button>
              </div>
              <div className="room-track">
                <img src={room.currentTrack.albumArtUrl} alt="Album" />
                <div className="track-details">
                  <span className="track-name">{room.currentTrack.title}</span>
                  <span className="artist-name">
                    {(room.currentTrack.artistNames || []).join(", ")}
                  </span>
                </div>
              </div>
            </div>
            <button
              className={`join-btn ${
                boothManager.isInBooth(room.id) ? "joined" : ""
              }`}
              onClick={() => handleJoinBooth(room.id)}
            >
              {boothManager.isInBooth(room.id) ? "Joined ✓" : "Join"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollabBoothScreen;
