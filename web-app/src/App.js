import React, { useState, useEffect } from 'react';
import './App.css';
import SpotifyAuth from './components/SpotifyAuth';
import MapView from './components/MapView';
import spotifyManager from './services/SpotifyManager';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    setIsAuthenticated(spotifyManager.isAuthenticated);
    setIsLoading(false);

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      spotifyManager.handleAuthCallback(code)
        .then(() => {
          setIsAuthenticated(true);
          // Clean up URL
          window.history.replaceState({}, document.title, '/');
        })
        .catch(error => {
          console.error('Auth callback error:', error);
          setIsLoading(false);
        });
    }
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="App loading">
        <div className="loader">🎵</div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthenticated ? (
        <MapView onLogout={handleLogout} />
      ) : (
        <SpotifyAuth onAuthSuccess={() => setIsAuthenticated(true)} />
      )}
    </div>
  );
}

export default App;
