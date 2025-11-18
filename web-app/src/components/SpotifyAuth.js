import React from 'react';
import './SpotifyAuth.css';
import spotifyManager from '../services/SpotifyManager';

function SpotifyAuth({ onAuthSuccess }) {
  const handleConnect = () => {
    spotifyManager.authenticate();
  };

  return (
    <div className="spotify-auth">
      <div className="auth-container">
        <div className="auth-logo">🎵</div>
        <h1 className="auth-title">Hearby</h1>
        <p className="auth-description">
          Connect to your Spotify account to share what you're listening to with nearby music lovers
        </p>
        <button className="auth-button" onClick={handleConnect}>
          Connect with Spotify
        </button>
        <p className="auth-note">
          You'll be redirected to Spotify to authorize the app
        </p>
      </div>
    </div>
  );
}

export default SpotifyAuth;
