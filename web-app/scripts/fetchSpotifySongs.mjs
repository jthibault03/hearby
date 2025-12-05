import fs from "fs/promises";
import fetch from "node-fetch";
import dotenv from "dotenv";


dotenv.config();

// Add or adjust playlist IDs to shape your dataset
const PLAYLIST_IDS = [
    "5jTkE0z8RM5ijInIHTOixF", // karaoke mix
];


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

async function fetchPlaylistTracks(token, playlistId, limit = 50) {
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `Playlist ${playlistId} error: ${res.status} ${JSON.stringify(data)}`
    );
  }

  return (data.items || [])
    .map((item) => item.track)
    .filter(Boolean)
    .filter((t) => t.id);
}

// Fetch artist genres in bulk from Spotify and return a map { artistId -> [genres] }.
async function fetchArtistGenres(token, artistIds) {
  const uniqueIds = [...new Set(artistIds)];
  const genreMap = {};

  // Spotify allows up to 50 IDs per request
  for (let i = 0; i < uniqueIds.length; i += 50) {
    const batch = uniqueIds.slice(i, i + 50);
    if (batch.length === 0) continue;

    const res = await fetch(
      `https://api.spotify.com/v1/artists?ids=${batch.join(",")}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.warn(
        `Artist genre fetch failed: ${res.status} ${JSON.stringify(data)}`
      );
      continue;
    }

    for (const artist of data.artists || []) {
      genreMap[artist.id] = artist.genres || [];
    }
  }

  return genreMap;
}

// Call ReccoBeats with Spotify track IDs to get audio features.
// async function fetchReccobeatsTrackFeatures(spotifyTrackId) {
//   // First call: resolve ReccoBeats track id from Spotify id
//   //const listUrl = new URL("https://api.reccobeats.com/v1/track");
//   const listUrl = options.url; //new URL("https://api.reccobeats.com/v1/track/:id/audio-features");
//   //listUrl.searchParams.set("ids", spotifyTrackId);

//     request(options, function (error, response) {
//     if (error) throw new Error(error);
//     console.log(response.body);
//     });


// print(response.text)

//   const listRes = await fetch(listUrl.toString(), {
//     headers: {
//       Accept: "application/json",
//     },
//   });

//   if (!listRes.ok) {
//     console.warn(
//       `ReccoBeats track lookup failed for ${spotifyTrackId}: ${listRes.status}`
//     );
//     return null;
//   }

//   const listData = await listRes.json();
//   const trackEntry = Array.isArray(listData?.data)
//     ? listData.data[0]
//     : listData?.data;

//   if (!trackEntry || !trackEntry.id) {
//     console.warn(`ReccoBeats returned no track for ${spotifyTrackId}`);
//     return null;
//   }

//   const reccoId = trackEntry.id;

//   // Second call: get audio features for that ReccoBeats track id
//   const featUrl = `https://api.reccobeats.com/v1/track/${reccoId}/audio-features`;
//   const featRes = await fetch(featUrl, {
//     headers: {
//       Accept: "application/json",
//     },
//   });

//   if (!featRes.ok) {
//     console.warn(
//       `ReccoBeats audio-features failed for ${reccoId}: ${featRes.status}`
//     );
//     return null;
//   }

//   const featData = await featRes.json();

//   const f = featData?.data || featData; // depending on API shape

//   if (!f) return null;

//   // Map ReccoBeats fields into our internal audioFeatures shape.
//   return {
//     tempo: f.tempo ?? null,
//     valence: f.valence ?? null,
//     energy: f.energy ?? null,
//     danceability: f.danceability ?? null,
//   };
// }

// Call ReccoBeats with Spotify track IDs to get audio features.
async function fetchReccobeatsTrackFeatures(spotifyTrackId) {
  //const url = `https://api.reccobeats.com/v1/track/${spotifyTrackId}/audio-features`;
  const url = `https://api.reccobeats.com/v1/track/878dadea-33c5-4c08-bdb9-e2b117475a99/audio-features`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    console.warn(
      `ReccoBeats audio-features failed for ${spotifyTrackId}: ${res.status}`
    );
    return null;
  }

  const data = await res.json();
  const f = data?.data || data;

  if (!f) {
    console.warn(`ReccoBeats returned empty data for ${spotifyTrackId}`);
    return null;
  }

  return {
    tempo: f.tempo ?? null,
    valence: f.valence ?? null,
    energy: f.energy ?? null,
    danceability: f.danceability ?? null,
  };
}

function inferMoodTags(features) {
  if (!features) return [];

  const tags = [];
  const { valence, energy, danceability, tempo } = features;

  if (valence != null) {
    if (valence > 0.7) tags.push("happy");
    else if (valence < 0.3) tags.push("sad");
  }

  if (energy != null) {
    if (energy > 0.75) tags.push("energetic");
    else if (energy < 0.4) tags.push("chill");
  }

  if (danceability != null && danceability > 0.7) {
    tags.push("danceable");
  }

  if (tempo != null) {
    if (tempo > 130) tags.push("fast");
    else if (tempo < 90) tags.push("slow");
  }

  return tags;
}

function normalizeTrack(spotifyTrack, features, idx, artistGenresMap) {
  const releaseYear = spotifyTrack.album?.release_date?.slice(0, 4);

  const artistIds = spotifyTrack.artists?.map((a) => a.id) || [];
  const genresFromArtists = artistIds.flatMap(
    (id) => artistGenresMap[id] || []
  );
  const uniqueGenres = [...new Set(genresFromArtists)];

  return {
    id: `song${idx + 1}`,
    sourceTrackId: spotifyTrack.id,
    name: spotifyTrack.name,
    artist: spotifyTrack.artists?.map((a) => a.name) || [],
    album: spotifyTrack.album?.name ?? null,
    year: releaseYear ? Number(releaseYear) : null,
    genres: uniqueGenres,
    country: null,
    language: null,
    moodTags: inferMoodTags(features),
    audioFeatures: features ?? null,
    userTags: [],
    lyricsSnippet: null,
    embedding: null,
    albumArt: spotifyTrack.album?.images?.[0]?.url ?? null,
  };
}

async function main() {
  try {
    const token = await getAccessToken();
    const allTracks = [];

    for (const playlistId of PLAYLIST_IDS) {
      const tracks = await fetchPlaylistTracks(token, playlistId, 50);
     // console.log(tracks)
      allTracks.push(...tracks);
    }

    const byId = {};
    for (const t of allTracks) {
      byId[t.id] = t;
    }

    const uniqueTracks = Object.values(byId).slice(0, 220);

    // Collect all artist IDs so we can enrich genres from Spotify's artist endpoint
    const allArtistIds = uniqueTracks.flatMap((t) =>
      (t.artists || []).map((a) => a.id)
    );
    const artistGenresMap = await fetchArtistGenres(token, allArtistIds);

    const normalized = {};
    for (let idx = 0; idx < uniqueTracks.length; idx++) {
      const t = uniqueTracks[idx];
      const features = await fetchReccobeatsTrackFeatures(t.id);
      const song = normalizeTrack(t, features, idx, artistGenresMap);
      normalized[song.id] = song;
    }

    const outPath = new URL("../src/services/mockSongData.generated.json", import.meta.url);
    await fs.writeFile(outPath, JSON.stringify(normalized, null, 2), "utf8");

    console.log("Wrote", Object.keys(normalized).length, "songs to", outPath.pathname);
  } catch (err) {
    console.error("Error while fetching songs:", err.message || err);
    process.exit(1);
  }
}

main();
