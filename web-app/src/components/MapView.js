import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import "./MapView.css";
import locationManager from "../services/LocationManager";
import spotifyManager from "../services/SpotifyManager";
import { MOCK_LISTENERS, MOCK_FRIENDS, MOCK_USER } from "../services/mockData";
import songData from "../services/mockSongData.generated.json";
import CurrentTrack from "./CurrentTrack";
import ListenersPanel from "./ListenersPanel";
import HeatmapLayer from "./HeatmapLayer";
import AIFilterPanel from "./AIFilterPanel";
import SameSongListeners from "./SameSongListeners";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const addJitter = (lat, lng) => {
  return [
    lat + (Math.random() - 0.5) * 0.002,
    lng + (Math.random() - 0.5) * 0.002,
  ];
};

const createAlbumIcon = (albumArtUrl, isFriend) => {
  if (!isFriend) {
    return L.divIcon({
      className: "album-marker",
      html: '<div class="album-art-marker ghost-marker"></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }

  return L.divIcon({
    className: "album-marker",
    html: `<div class="album-art-marker friend-marker" style="background-image: url('${albumArtUrl}')"></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const FEATURED_CITY_CLUSTERS = [
  { name: "Berkeley", lat: 37.8715, lng: -122.273, baseIntensity: 0.9 },
  { name: "San Francisco", lat: 37.7749, lng: -122.4194, baseIntensity: 0.85 },
  { name: "Oakland", lat: 37.8044, lng: -122.2711, baseIntensity: 0.8 },
  { name: "San Jose", lat: 37.3382, lng: -121.8863, baseIntensity: 0.75 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437, baseIntensity: 0.85 },
  { name: "Sacramento", lat: 38.5816, lng: -121.4944, baseIntensity: 0.7 },
  { name: "Seattle", lat: 47.6062, lng: -122.3321, baseIntensity: 0.7 },
  { name: "Portland", lat: 45.5152, lng: -122.6784, baseIntensity: 0.65 },
  { name: "New York", lat: 40.7128, lng: -74.006, baseIntensity: 0.9 },
  { name: "Chicago", lat: 41.8781, lng: -87.6298, baseIntensity: 0.8 },
  { name: "Atlanta", lat: 33.749, lng: -84.388, baseIntensity: 0.75 },
  { name: "Houston", lat: 29.7604, lng: -95.3698, baseIntensity: 0.75 },
];

const DEFAULT_CENTER = [37.8715, -122.273];

function MapView({ onLogout, onOpenSettings, onOpenCollab }) {
  const [userLocation, setUserLocation] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [showFriends, setShowFriends] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [map, setMap] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAIFilter, setShowAIFilter] = useState(false);
  const [showSameSong, setShowSameSong] = useState(false);
  const [visibleListeners, setVisibleListeners] = useState(MOCK_LISTENERS);

  useEffect(() => {
    locationManager
      .requestLocation()
      .then((loc) => {
        setUserLocation(loc);
        setMapCenter([loc.latitude, loc.longitude]);
      })
      .catch(() => {
        setMapCenter(DEFAULT_CENTER);
      });

    spotifyManager.getCurrentlyPlaying().then((track) => {
      setCurrentTrack(track);
    });
  }, []);

  const handleTrackSelect = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const filteredFriends = MOCK_FRIENDS.filter(
    (f) =>
      f.displayName.toLowerCase().includes(friendSearch.toLowerCase()) ||
      f.username.toLowerCase().includes(friendSearch.toLowerCase())
  );

  const heatmapPoints = useMemo(() => {
    if (!visibleListeners || visibleListeners.length === 0) return [];

    // Density-based intensity: count listeners within a small radius.
    const RADIUS_DEGREES = 0.01; // ~0.6 miles; tweak as needed

    const points = visibleListeners.map((listener) => {
      const { latitude, longitude } = listener.location;

      let neighbors = 0;
      for (const other of visibleListeners) {
        const dLat = other.location.latitude - latitude;
        const dLng = other.location.longitude - longitude;
        if (Math.abs(dLat) <= RADIUS_DEGREES && Math.abs(dLng) <= RADIUS_DEGREES) {
          neighbors += 1;
        }
      }

      // Map neighbor count to 0..1 and clamp.
      const intensity = Math.min(1, neighbors / 20); // 20 listeners => max heat

      return [latitude, longitude, intensity];
    });

    return points;
  }, [visibleListeners]);

  useEffect(() => {
    if (!map) return;

    const updateVisibleListeners = () => {
      const bounds = map.getBounds();
      const inView = MOCK_LISTENERS.filter((listener) =>
        bounds.contains([
          listener.location.latitude,
          listener.location.longitude,
        ])
      );
      setVisibleListeners(inView);
    };

    updateVisibleListeners();

    map.on("moveend", updateVisibleListeners);
    map.on("zoomend", updateVisibleListeners);

    return () => {
      map.off("moveend", updateVisibleListeners);
      map.off("zoomend", updateVisibleListeners);
    };
  }, [map]);

  return (
    <div className="map-view">
      <MapContainer
        center={mapCenter}
        zoom={14}
        className="map-container"
        zoomControl={false}
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <HeatmapLayer points={heatmapPoints} radius={45} blur={35} maxZoom={1.5} />

        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            eventHandlers={{
              click: () => {
                if (map)
                  map.flyTo(
                    [userLocation.latitude, userLocation.longitude],
                    16
                  );
              },
            }}
          >
            <Popup>You are here</Popup>
          </Marker>
        )}

        {MOCK_LISTENERS.map((listener) => {
          const track = songData[listener.trackId];
          const position = listener.isFriend
            ? [listener.location.latitude, listener.location.longitude]
            : addJitter(
                listener.location.latitude,
                listener.location.longitude
              );

          return (
            <Marker
              key={listener.id}
              position={position}
              icon={createAlbumIcon(track?.albumArt, listener.isFriend)}
            >
              <Popup className="music-popup">
                <div className="popup-content">
                  {listener.isFriend && (
                    <img
                      src={track?.albumArt}
                      alt="Album"
                      className="popup-album"
                    />
                  )}
                  <div className="popup-info">
                    <strong>{track?.name}</strong>
                    <p>
                      {Array.isArray(track?.artist)
                        ? track.artist.join(", ")
                        : track?.artist}
                    </p>
                    <span className="listener-name-wrapper">
                      <span className="listener-name">
                        {listener.isFriend ? (
                          <>
                            {listener.displayName}
                            <span className="friend-tag">Friend</span>
                          </>
                        ) : (
                          "Nearby Listener"
                        )}
                      </span>
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="top-bar">
        <h1 className="app-title">Hearby</h1>
        <div className="top-actions">
          <button
            className="collab-btn"
            onClick={() => setShowAIFilter(true)}
          >
            🤖 AI Filter
          </button>
          <div className="friends-dropdown-container">
            <button
              className="collab-btn"
              onClick={() => setShowFriends(!showFriends)}
            >
              👥 Friends
            </button>
            {showFriends && (
              <div className="friends-dropdown">
                <input
                  type="text"
                  placeholder="Search friends..."
                  className="friend-search"
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                />
                <div className="friends-list">
                  {filteredFriends.map((friend) => (
                    <div key={friend.id} className="friend-item">
                      <div
                        className="friend-avatar"
                        style={{
                          backgroundImage: `url(https://i.pravatar.cc/150?u=${friend.username})`,
                        }}
                      ></div>
                      <div className="friend-info">
                        <span className="friend-name">
                          {friend.displayName}
                        </span>
                        <span
                          className={`friend-status ${
                            friend.isOnline ? "online" : "offline"
                          }`}
                        >
                          {friend.isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="collab-btn" onClick={onOpenCollab}>
            🎤 Booths
          </button>
          <button className="settings-btn" onClick={onOpenSettings}>
            <div
              className="avatar"
              style={{
                backgroundImage: `url(https://i.pravatar.cc/150?u=${MOCK_USER.username})`,
              }}
            ></div>
          </button>
        </div>
      </div>

      <ListenersPanel
        listeners={visibleListeners}
        onTrackSelect={handleTrackSelect}
      />

      <button
        className="recenter-btn"
        style={{
          position: "absolute",
          bottom: "150px",
          right: "15px",
          zIndex: 1000,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (map && userLocation) {
            map.flyTo([userLocation.latitude, userLocation.longitude], 15);
          }
        }}
        title="Recenter Map"
      >
        📍
      </button>

      {currentTrack && (
        <CurrentTrack
          track={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onShowSameSong={() => setShowSameSong(true)}
        />
      )}

      {showAIFilter && (
        <AIFilterPanel
          listeners={MOCK_LISTENERS}
          onClose={() => setShowAIFilter(false)}
          onTrackSelect={handleTrackSelect}
        />
      )}

      {showSameSong && (
        <SameSongListeners
          listeners={MOCK_LISTENERS}
          currentTrack={currentTrack}
          onClose={() => setShowSameSong(false)}
        />
      )}
    </div>
  );
}

export default MapView;
