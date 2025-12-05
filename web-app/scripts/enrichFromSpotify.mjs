import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SONGS_JSON_RELATIVE = "../src/services/mockSongData.generated.json";

async function getAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment."
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Token error: ${res.status} ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

async function fetchSpotifyTracks(token, trackIds) {
  const out = {};
  const ids = [...new Set(trackIds.filter(Boolean))];

  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    if (!batch.length) continue;

    const res = await fetch(
      `https://api.spotify.com/v1/tracks?ids=${batch.join(",")}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.warn(
        `Spotify tracks fetch failed: ${res.status} ${JSON.stringify(data)}`
      );
      continue;
    }

    for (const t of data.tracks || []) {
      if (!t || !t.id) continue;
      out[t.id] = t;
    }
  }

  return out;
}

async function fetchArtistGenres(token, artistIds) {
  const uniqueIds = [...new Set(artistIds)];
  const genreMap = {};

  for (let i = 0; i < uniqueIds.length; i += 50) {
    const batch = uniqueIds.slice(i, i + 50);
    if (!batch.length) continue;

    const res = await fetch(
      `https://api.spotify.com/v1/artists?ids=${batch.join(",")}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.warn(
        `Spotify artists fetch failed: ${res.status} ${JSON.stringify(data)}`
      );
      continue;
    }

    for (const a of data.artists || []) {
      if (!a || !a.id) continue;
      genreMap[a.id] = a.genres || [];
    }
  }

  return genreMap;
}

async function main() {
  const baseDir = path.resolve(__dirname);
  const songsPath = path.resolve(baseDir, SONGS_JSON_RELATIVE);

  const jsonText = await fs.readFile(songsPath, "utf8");
  const songs = JSON.parse(jsonText);

  const token = await getAccessToken();

  const allSourceIds = Object.values(songs)
    .map((s) => s.sourceTrackId)
    .filter(Boolean);

  const trackMap = await fetchSpotifyTracks(token, allSourceIds);

  const allArtistIds = [];
  for (const t of Object.values(trackMap)) {
    for (const a of t.artists || []) {
      if (a && a.id) allArtistIds.push(a.id);
    }
  }

  const artistGenresMap = await fetchArtistGenres(token, allArtistIds);

  for (const songKey of Object.keys(songs)) {
    const song = songs[songKey];
    const spotifyId = song.sourceTrackId;
    if (!spotifyId) continue;

    const t = trackMap[spotifyId];
    if (!t) continue;

    // album art
    const albumImage = t.album?.images?.[0]?.url || null;
    if (albumImage) {
      song.albumArt = albumImage;
    }

    // year from album release date, if missing or null
    if (!song.year && t.album?.release_date) {
      const y = Number(String(t.album.release_date).slice(0, 4));
      if (!Number.isNaN(y)) song.year = y;
    }

    // genres from artists
    const artistIds = (t.artists || []).map((a) => a.id).filter(Boolean);
    const genresFromArtists = artistIds.flatMap(
      (id) => artistGenresMap[id] || []
    );
    const mergedGenres = new Set([...(song.genres || []), ...genresFromArtists]);
    song.genres = Array.from(mergedGenres);
  }

  await fs.writeFile(songsPath, JSON.stringify(songs, null, 2), "utf8");
  console.log(
    "Enriched",
    Object.keys(songs).length,
    "songs with Spotify album art / genres / year"
  );
}

main().catch((err) => {
  console.error("Error enriching songs from Spotify:", err);
  process.exit(1);
});
