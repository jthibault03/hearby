import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import "./MapView.css";
import locationManager from "../services/LocationManager";
import spotifyManager from "../services/SpotifyManager";
import {
  MOCK_LISTENERS,
  MOCK_FRIENDS,
  MOCK_USER,
  simulateListenerMovement,
} from "../services/mockData";
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

// Ensure we always fetch listeners in at least a ~0.75km radius even when very zoomed in.
const MIN_SEARCH_RADIUS_METERS = 750;

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
  const [allListeners, setAllListeners] = useState(MOCK_LISTENERS);
  const [visibleListeners, setVisibleListeners] = useState(MOCK_LISTENERS);
  // `baseVisibleListeners` is the set determined purely by map bounds (no query applied).
  // `visibleListeners` is what we actually show (base + optional query filter applied).
  const [baseVisibleListeners, setBaseVisibleListeners] = useState(MOCK_LISTENERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [simulatedTick, setSimulatedTick] = useState(0);
  // keep a ref of the latest searchQuery so map event handlers (which are
  // registered once) can read the current value without needing to re-bind.
  const searchQueryRef = useRef(searchQuery);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery, allListeners, map]);

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

  const handleSimulateTime = () => {
    setSimulatedTick((t) => t + 1);
    setAllListeners((prev) => simulateListenerMovement(prev));
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
        if (
          Math.abs(dLat) <= RADIUS_DEGREES &&
          Math.abs(dLng) <= RADIUS_DEGREES
        ) {
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
    if (!map) {
      setBaseVisibleListeners(allListeners);
      setVisibleListeners(allListeners);
      return;
    }

    const updateVisibleListeners = () => {
      const bounds = map.getBounds();
      const center = bounds.getCenter();
      const minimumBounds = center.toBounds(MIN_SEARCH_RADIUS_METERS);
      const searchBounds = L.latLngBounds(
        bounds.getSouthWest(),
        bounds.getNorthEast()
      ).extend(minimumBounds);

      const inView = allListeners.filter((listener) =>
        searchBounds.contains([
          listener.location.latitude,
          listener.location.longitude,
        ])
      );
      // update the base viewport set
      setBaseVisibleListeners(inView);

      // If there's an active query, re-run the query against the new in-view set.
      if (searchQueryRef.current && searchQueryRef.current.trim()) {
        // apply same search flow used elsewhere (makes a network call or local fallback)
        applyQuery(searchQueryRef.current.trim(), inView)
          .then((result) => {
            if (Array.isArray(result)) setVisibleListeners(result);
            else setVisibleListeners(inView);
          })
          .catch(() => setVisibleListeners(inView));
      } else {
        // no active query -> show base viewport listeners
        setVisibleListeners(inView);
      }
    };

    updateVisibleListeners();

    map.on("moveend", updateVisibleListeners);
    map.on("zoomend", updateVisibleListeners);

    return () => {
      map.off("moveend", updateVisibleListeners);
      map.off("zoomend", updateVisibleListeners);
    };
  }, [map, allListeners]);

  // Helper: apply a textual query to a provided set of listeners (`songSet`).
  // Returns a Promise resolving to an array of listeners (possibly empty).
  const applyQuery = async (q, songSet) => {
    if (!q) return songSet;
    setIsSearching(true);
    try {
      const res = await fetch("https://noggin.rea.gent/misleading-dingo-2120", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer rg_v1_zo51iagt405uj11irsolxk3h7xscji06aruq_ngk",
        },
        body: JSON.stringify({ songData: songSet, query: q }),
      });

      const text = await res.text();
      try {
        const parsed = JSON.parse(text);

        let newListeners = [];
        if (Array.isArray(parsed)) newListeners = parsed;
        else if (Array.isArray(parsed.listeners)) newListeners = parsed.listeners;
        else if (Array.isArray(parsed.viewableListeners)) newListeners = parsed.viewableListeners;
        else if (Array.isArray(parsed.data)) newListeners = parsed.data;

        if (newListeners.length > 0) return newListeners;
        // else fallthrough to local fallback
      } catch (e) {
        // JSON parse failed — fallthrough to local fallback
      }

      // Local fallback search limited to `songSet` (so results remain in the viewport)
      const fallback = (function localSearch(query, scope) {
        const qWords = query
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean);

        const yearMatch = query.match(/\b(19|20)\d{2}\b/);
        const decadeMatch = query.match(/\b(19|20)\d0s\b/);
        const targetYear = yearMatch ? Number(yearMatch[0]) : null;
        const decadeStart = decadeMatch ? Number(decadeMatch[0].slice(0,3) + '0') : null;

        return (scope || []).filter((listener) => {
          const track = songData[listener.trackId];
          if (!track) return false;

          if (targetYear && typeof track.year === 'number') {
            if (track.year === targetYear) return true;
          }
          if (decadeStart && typeof track.year === 'number') {
            if (track.year >= decadeStart && track.year < decadeStart + 10) return true;
          }

          const textParts = [
            track.name,
            Array.isArray(track.artist) ? track.artist.join(' ') : track.artist,
            track.album,
            (track.genres || []).join(' '),
            (track.moodTags || []).join(' '),
            track.kaggleRaw?.track_genre,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return qWords.every((w) => textParts.includes(w));
        });
      })(q, songSet);

      return fallback;
    } finally {
      setIsSearching(false);
    }
  };

  // When the user types a query, call the Noggin endpoint with the current
  // visible listeners and the query. Noggin should return a pruned array of
  // listeners which becomes the new visible set on the map and panels.
  useEffect(() => {
    let cancelled = false;
    const q = searchQuery.trim();

    // If query is empty, refresh visible listeners based on current map bounds
    if (!q) {
      if (!map) {
        setVisibleListeners(allListeners);
        return;
      }

      const bounds = map.getBounds();
      const center = bounds.getCenter();
      const minimumBounds = center.toBounds(MIN_SEARCH_RADIUS_METERS);
      const searchBounds = L.latLngBounds(
        bounds.getSouthWest(),
        bounds.getNorthEast()
      ).extend(minimumBounds);

      const inView = allListeners.filter((listener) =>
        searchBounds.contains([
          listener.location.latitude,
          listener.location.longitude,
        ])
      );
      setVisibleListeners(inView);
      return;
    }

    setIsSearching(true);

    fetch("https://noggin.rea.gent/misleading-dingo-2120", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer rg_v1_zo51iagt405uj11irsolxk3h7xscji06aruq_ngk",
      },
      body: JSON.stringify({ songData: visibleListeners, query: q }),
    })
      .then((res) => res.text())
      .then((text) => {
        if (cancelled) return;
        try {
          const parsed = JSON.parse(text);

          let newListeners = [];
          if (Array.isArray(parsed)) newListeners = parsed;
          else if (Array.isArray(parsed.listeners)) newListeners = parsed.listeners;
          else if (Array.isArray(parsed.viewableListeners)) newListeners = parsed.viewableListeners;
          else if (Array.isArray(parsed.data)) newListeners = parsed.data;

          if (newListeners.length > 0) {
            setVisibleListeners(newListeners);
            console.debug("Noggin returned", newListeners.length, "listeners");
          } else {
            // Noggin returned no matches — fall back to a quick local filter
            console.debug("Noggin returned no listeners, falling back to local filter for query:", q);
            const fallback = (function localSearch(query) {
              const qWords = query
                .toLowerCase()
                .split(/\s+/)
                .filter(Boolean);

              // handle explicit year match
              const yearMatch = query.match(/\b(19|20)\d{2}\b/);
              const decadeMatch = query.match(/\b(19|20)\d0s\b/);
              const targetYear = yearMatch ? Number(yearMatch[0]) : null;
              const decadeStart = decadeMatch ? Number(decadeMatch[0].slice(0,3) + '0') : null;

              return allListeners.filter((listener) => {
                const track = songData[listener.trackId];
                if (!track) return false;

                if (targetYear && typeof track.year === 'number') {
                  if (track.year === targetYear) return true;
                }
                if (decadeStart && typeof track.year === 'number') {
                  if (track.year >= decadeStart && track.year < decadeStart + 10) return true;
                }

                const textParts = [
                  track.name,
                  Array.isArray(track.artist) ? track.artist.join(' ') : track.artist,
                  track.album,
                  (track.genres || []).join(' '),
                  (track.moodTags || []).join(' '),
                  track.kaggleRaw?.track_genre,
                ]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase();

                // require all words to appear somewhere
                return qWords.every((w) => textParts.includes(w));
              });
            })(q);

            setVisibleListeners(fallback);
          }
        } catch (e) {
          console.error("Failed to parse noggin response", e);
          // Parsing failed — fallback to local search
          const fallback = (function localSearch(query) {
            const qWords = query
              .toLowerCase()
              .split(/\s+/)
              .filter(Boolean);

            const yearMatch = query.match(/\b(19|20)\d{2}\b/);
            const decadeMatch = query.match(/\b(19|20)\d0s\b/);
            const targetYear = yearMatch ? Number(yearMatch[0]) : null;
            const decadeStart = decadeMatch ? Number(decadeMatch[0].slice(0,3) + '0') : null;

            return allListeners.filter((listener) => {
              const track = songData[listener.trackId];
              if (!track) return false;

              if (targetYear && typeof track.year === 'number') {
                if (track.year === targetYear) return true;
              }
              if (decadeStart && typeof track.year === 'number') {
                if (track.year >= decadeStart && track.year < decadeStart + 10) return true;
              }

              const textParts = [
                track.name,
                Array.isArray(track.artist) ? track.artist.join(' ') : track.artist,
                track.album,
                (track.genres || []).join(' '),
                (track.moodTags || []).join(' '),
                track.kaggleRaw?.track_genre,
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

              return qWords.every((w) => textParts.includes(w));
            });
          })(q);

          setVisibleListeners(fallback);
        }
      })
      .catch((err) => console.error("Noggin request failed", err))
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  return (
    <div className="map-view">
      <MapContainer
        center={mapCenter}
        zoom={14}
        maxZoom={17}
        className="map-container"
        zoomControl={false}
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={17}
        />

        <HeatmapLayer
          points={heatmapPoints}
          radius={45}
          blur={35}
          maxZoom={1.5}
        />

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

        {visibleListeners.map((listener) => {
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
        <div className="search-wrapper">
          <input
            className="search-input"
            type="text"
            placeholder='Search for listeners... e.g. "dance music"'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        {searchQuery && (
          <button
            type="button"
            className="search-clear-btn"
            title="Clear search"
              onClick={() => setSearchQuery("")}
            >
              ×
            </button>
          )}
          {isSearching && <span className="search-status">Thinking…</span>}
        </div>
        <div className="top-actions">
          <button
            className="collab-btn"
            onClick={handleSimulateTime}
            title="Nudge everyone forward in time and move their positions"
          >
            Simulate Time{simulatedTick > 0 ? ` (${simulatedTick})` : ""}
          </button>
          <button className="collab-btn ai-filter-btn" onClick={() => setShowAIFilter(true)}>
            🤖 Filter
          </button>
          <div className="friends-dropdown-container">
            <button
              className="collab-btn"
              onClick={() => setShowFriends(!showFriends)}
            >
              Friends
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
            Booths
          </button>
          <button className="settings-btn" onClick={onOpenSettings}>
            <div
              className="avatar"
              style={{
                backgroundImage: `url(https://i.pravatar.cc/150?u=${MOCK_USER.id})`,
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          width="24"
          height="24"
        >
          <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
        </svg>
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
          listeners={visibleListeners}
          onClose={() => setShowAIFilter(false)}
          onTrackSelect={handleTrackSelect}
        />
      )}

      {showSameSong && (
        <SameSongListeners
          listeners={visibleListeners}
          currentTrack={currentTrack}
          onClose={() => setShowSameSong(false)}
        />
      )}
    </div>
  );
}

export default MapView;
