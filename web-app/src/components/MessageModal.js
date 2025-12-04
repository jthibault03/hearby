import React, { useState } from "react";
import "./MessageModal.css";

const getAISuggestedMessages = (track) => {
  const suggestions = {
    "Kendrick Lamar": [
      "kendrick >> drake",
      "This track hits different 🔥",
      "GKMC or DAMN.?",
      "Pulitzer prize worthy fr",
    ],
    "Billie Eilish": [
      "Her voice is so haunting 😍",
      "Have you seen her live?",
      "Ocean Eyes vibes",
      "This album is a masterpiece",
    ],
    "Sabrina Carpenter": [
      "This song is so catchy!",
      "Emails I Can't Send is fire",
      "She's so underrated",
      "Pop perfection 💅",
    ],
    "Chappell Roan": [
      "Pink Pony Club is the anthem",
      "She's the next pop icon",
      "Midwest Princess energy",
      "This deserves all the hype",
    ],
    "Taylor Swift": [
      "Which era is your fav?",
      "Swiftie for life 💕",
      "This bridge though",
      "Midnight Rain hits different",
    ],
    "Post Malone": [
      "His range is insane",
      "Rockstar vibes",
      "Better Now > everything",
      "Underrated artist honestly",
    ],
    "Hozier": [
      "Take Me to Church was iconic",
      "His lyrics are poetry",
      "That voice 😍",
      "Wasteland Baby is perfect",
    ],
    "Tommy Richman": [
      "Million Dollar Baby on repeat",
      "This is such a vibe",
      "Underrated track",
      "Summer anthem energy",
    ],
    "Shaboozey": [
      "Country music renaissance",
      "This is so fun",
      "Bar vibes 🍻",
      "Unexpected bop",
    ],
    "Benson Boone": [
      "That vocal range though",
      "Beautiful Things had me crying",
      "In The Stars > everything",
      "Future star for sure",
    ],
  };

  const artist = track.artist;
  const artistSuggestions = suggestions[artist];

  if (artistSuggestions) {
    return artistSuggestions;
  }

  return [
    "Love this track! 🎵",
    "Your music taste is fire",
    "What else are you listening to?",
    "We should make a playlist together",
  ];
};

function MessageModal({ user, track, onClose }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const suggestedMessages = getAISuggestedMessages(track);

  const handleSend = () => {
    if (message.trim()) {
      setSent(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
  };

  return (
    <div className="message-overlay" onClick={onClose}>
      <div className="message-modal" onClick={(e) => e.stopPropagation()}>
        <div className="message-header">
          <div className="message-user-info">
            <div
              className="message-user-avatar"
              style={{
                backgroundImage: `url(https://i.pravatar.cc/150?u=${user.username})`,
              }}
            ></div>
            <div>
              <div className="message-user-name">
                {user.isFriend ? user.displayName : "Nearby Listener"}
              </div>
              <div className="message-user-location">
                {user.location.city}
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {!sent ? (
          <>
            <div className="ai-suggestions">
              <div className="suggestions-label">
                <span className="ai-icon">✨</span> AI Suggested Messages
              </div>
              <div className="suggestions-grid">
                {suggestedMessages.map((suggestion, index) => (
                  <button
                    key={index}
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="message-input-container">
              <textarea
                className="message-input"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!message.trim()}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="message-sent">
            <div className="sent-icon">✓</div>
            <div className="sent-text">Message sent!</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageModal;
