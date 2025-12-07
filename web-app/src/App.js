import React, { useState } from 'react';
import "./App.css";
import SpotifyAuth from "./components/SpotifyAuth";
import MapView from "./components/MapView";
import CollabBoothListScreen from "./screens/CollabBoothListScreen";
import CollabBoothScreen from "./screens/CollabBoothScreen";
import ProfileSettings from "./screens/ProfileSettings";

function App() {
  const hasToken = !!localStorage.getItem("spotify_token");
  const [currentScreen, setCurrentScreen] = useState('map');
  const [activeBoothId, setActiveBoothId] = useState(null);

  if (!hasToken) {
    return <SpotifyAuth />;
  }

  const handleLogout = () => {
    localStorage.removeItem("spotify_token");
    window.location.reload();
  };

  switch (currentScreen) {
    case 'collab':
      return (
        <CollabBoothListScreen
          onBack={() => setCurrentScreen('map')}
          onEnterBooth={(boothId) => {
            setActiveBoothId(boothId);
            setCurrentScreen('booth');
          }}
        />
      );
    case 'booth':
      return (
        <CollabBoothScreen
          boothId={activeBoothId}
          onBack={() => {
            setCurrentScreen('collab');
            setActiveBoothId(null);
          }}
        />
      );
    case 'settings':
      return <ProfileSettings onBack={() => setCurrentScreen('map')} onLogout={handleLogout} />;
    case 'map':
    default:
      return (
        <MapView
          onLogout={handleLogout}
          onOpenSettings={() => setCurrentScreen('settings')}
          onOpenCollab={() => setCurrentScreen('collab')}
        />
      );
  }
}

export default App;
