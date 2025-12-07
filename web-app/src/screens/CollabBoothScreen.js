import React, { useMemo, useState, useRef, useEffect } from "react";
import boothManager from "../services/BoothManager";
import "./CollabBoothScreen.css";

const MOCK_MESSAGES = [
  { id: 1, author: "DJ Nova", text: "Welcome to the booth! Drop your recs 👇", timestamp: "10:24" },
  { id: 2, author: "You", text: "Loving the vibe! Let's queue a synthwave track next.", timestamp: "10:25" },
  { id: 3, author: "Maya S.", text: "Anyone want a tempo bump after this one?", timestamp: "10:26" },
  { id: 4, author: "Sabrina C.", text: "Let's do it!", timestamp: "10:27" },
  { id: 5, author: "Mary T.", text: "This beat is the best!", timestamp: "10:30" },
];

function CollabBoothScreen({ boothId, onBack }) {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);

  const booth = useMemo(() => {
    const booths = boothManager.getAllBooths();
    return (
      booths.find((b) => b.id === boothId) ||
      boothManager.getCurrentBooth() ||
      booths[0]
    );
  }, [boothId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (boothId && !boothManager.isInBooth(boothId)) {
      onBack?.();
    }
  }, [boothId, onBack]);

  if (!booth) {
    return (
      <div className="collab-booth-screen">
        <div className="booth-header">
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
          <h1>Collab Booth</h1>
        </div>
        <div className="empty-state">No booth selected.</div>
      </div>
    );
  }

  const handleSend = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    const newMessage = {
      id: Date.now(),
      author: "You",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setChatInput("");
  };

  return (
    <div className="collab-booth-screen">
      <div className="booth-header">
        <div className="header-actions">
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
          {booth && (
            <button
              className="leave-btn"
              onClick={() => {
                boothManager.leaveBooth(booth.id);
                onBack();
              }}
            >
              Leave Booth
            </button>
          )}
        </div>
        <div className="booth-title-block">
          <h1>{booth.name}</h1>
          <span className="booth-meta">{booth.participants || booth.members?.length || 0} listening live</span>
        </div>
      </div>

      <div className="booth-content">
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <p className="chat-title">Booth Chat</p>
              <p className="chat-subtitle">Coordinate tracks, share links, and react in real-time.</p>
            </div>
          </div>

          <div className="chat-window">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.author === "You" ? "self" : ""}`}
              >
                <div className="chat-author">
                  <span>{msg.author}</span>
                  <span className="chat-time">{msg.timestamp}</span>
                </div>
                <div className="chat-bubble">{msg.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-row">
            <input
              type="text"
              placeholder="Send a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                }
              }}
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>

        <div className="side-panel">
          <div className="current-track-card">
            <div className="card-heading">Now Playing</div>
            <div className="track-top">
              {booth.currentTrack?.albumArt && (
                <div className="track-body">
                  <img
                    src={booth.currentTrack.albumArt}
                    alt={booth.currentTrack.name}
                  />
                  <div className="track-details">
                    <p className="track-title">{booth.currentTrack.name}</p>
                    <p className="track-artist">{booth.currentTrack.artist}</p>
                  </div>
                </div>
              )}
              <div className="track-actions">
                <button className="ghost-btn">Suggest Change</button>
                <button className="ghost-btn danger">Suggest Skip</button>
              </div>
            </div>
          </div>

          <div className="members-card">
            <div className="card-heading">Visible Listeners</div>
            <div className="member-list">
              {booth.members?.map((member) => (
                <div className="member-row" key={member.id}>
                  <div
                    className="member-avatar"
                    style={{
                      backgroundImage: `url(https://i.pravatar.cc/100?u=${member.id})`,
                    }}
                  ></div>
                  <div className="member-info">
                    <span className="member-name">{member.displayName}</span>
                    <span className="member-username">@{member.username || member.displayName.toLowerCase()}</span>
                  </div>
                </div>
              )) || <p className="empty-state">No listeners yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollabBoothScreen;
