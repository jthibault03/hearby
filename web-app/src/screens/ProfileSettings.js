import React, { useState } from "react";
import { MOCK_USER } from "../services/mockData";
import "./ProfileSettings.css";

const ProfileSettings = ({ onBack, onLogout }) => {
  const [privacy, setPrivacy] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyDuration, setPrivacyDuration] = useState("1h");
  const [privacyEndTime, setPrivacyEndTime] = useState(null);
  const [remainingMs, setRemainingMs] = useState(0);

  const durationToMs = (value) => {
    switch (value) {
      case "30m":
        return 30 * 60 * 1000;
      case "1h":
        return 60 * 60 * 1000;
      case "8h":
        return 8 * 60 * 60 * 1000;
      case "24h":
        return 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000;
    }
  };

  const formatRemaining = (ms) => {
    if (ms <= 0) return "Less than a minute";
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const handlePrivacyChange = (checked) => {
    if (checked) {
      setPrivacy(true);
      return;
    }
    // Turning off: require a duration selection via modal.
    setShowPrivacyModal(true);
  };

  const confirmPrivacyOff = () => {
    setPrivacy(false);
    const ms = durationToMs(privacyDuration);
    const end = Date.now() + ms;
    setPrivacyEndTime(end);
    setRemainingMs(ms);
    setShowPrivacyModal(false);
    // In a real app, you'd persist privacyDuration to the backend.
  };

  const cancelPrivacyOff = () => {
    // Keep sharing on if user cancels.
    setPrivacy(true);
    setShowPrivacyModal(false);
  };

  // Countdown for remaining privacy pause.
  React.useEffect(() => {
    if (!privacyEndTime || privacy) {
      setRemainingMs(0);
      return undefined;
    }

    const tick = () => {
      const msLeft = privacyEndTime - Date.now();
      if (msLeft <= 0) {
        setPrivacy(true);
        setPrivacyEndTime(null);
        setRemainingMs(0);
      } else {
        setRemainingMs(msLeft);
      }
    };

    tick();
    const id = setInterval(tick, 1000 * 30); // 30s cadence is enough for display
    return () => clearInterval(id);
  }, [privacyEndTime, privacy]);

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
      </div>

      <div className="profile-content">
        <h1>Settings</h1>
        <div className="user-section">
          <div
            className="large-avatar"
            style={{
              backgroundImage: `url(https://i.pravatar.cc/150?u=${MOCK_USER.id})`,
            }}
          ></div>
          <h2>{MOCK_USER.displayName}</h2>
          <p>@{MOCK_USER.username}</p>
        </div>

        <div className="settings-group">
          <h3>Privacy</h3>
          <div className="setting-item">
            <div className="setting-label">
              <span>Share Listening Activity</span>
              <p>Allow nearby users to see what you're listening to</p>
              {!privacy && remainingMs > 0 && (
                <span className="status-pill">
                  Paused · {formatRemaining(remainingMs)}
                </span>
              )}
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={privacy}
                onChange={(e) => handlePrivacyChange(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        <div className="settings-group">
          <h3>Account</h3>
          <button className="danger-btn" onClick={onLogout}>
            Disconnect Spotify
          </button>
        </div>
      </div>

      {showPrivacyModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Pause sharing</h3>
            <p>Select how long to pause showing your listening activity.</p>
            <div className="duration-list">
              {[
                { value: "30m", label: "30 minutes" },
                { value: "1h", label: "1 hour" },
                { value: "8h", label: "8 hours" },
                { value: "24h", label: "24 hours" },
              ].map((opt) => (
                <label key={opt.value} className="duration-option">
                  <input
                    type="radio"
                    name="privacy-duration"
                    value={opt.value}
                    checked={privacyDuration === opt.value}
                    onChange={() => setPrivacyDuration(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={cancelPrivacyOff}>
                Cancel
              </button>
              <button className="primary-btn" onClick={confirmPrivacyOff}>
                Pause sharing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
