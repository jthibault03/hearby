import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

// This script reads a Kaggle Spotify tracks CSV and builds
// mockSongData.generated.json for the web app.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust this filename if your Kaggle file is named differently.
const KAGGLE_CSV_RELATIVE = "../data/dataset.csv";
const OUTPUT_JSON_RELATIVE = "../src/services/mockSongData.generated.json";
const EXISTING_JSON_RELATIVE = "../src/services/mockSongData.generated.json";

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

async function loadExistingSongs(baseDir) {
  try {
    const existingPath = path.resolve(baseDir, EXISTING_JSON_RELATIVE);
    const jsonText = await fs.readFile(existingPath, "utf8");
    const data = JSON.parse(jsonText);
    const byTitleArtist = {};
    for (const key of Object.keys(data)) {
      const song = data[key];
      const titleKey = (song.name || "").toLowerCase().trim();
      const artistKey = (song.artist || [])
        .join(",")
        .toLowerCase()
        .trim();
      const composite = `${titleKey}__${artistKey}`;
      byTitleArtist[composite] = song;
    }
    return byTitleArtist;
  } catch (e) {
    // If file doesn't exist yet or is invalid, just skip merging.
    return {};
  }
}

async function main() {
  const baseDir = path.resolve(__dirname);

  // 1. Read Kaggle CSV
  const kagglePath = path.resolve(baseDir, KAGGLE_CSV_RELATIVE);
  const csvText = await fs.readFile(kagglePath, "utf8");

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  });

  // 2. Load existing songs to preserve year, albumArtUrl, moodTags when possible
  const existingByTitleArtist = await loadExistingSongs(baseDir);

  const normalized = {};
  let idx = 0;

  for (const row of records) {
    idx += 1;
    const id = `song${idx}`;

    // Kaggle common columns (adjust if your file differs)
    const name = row.track_name || row.track || row.name || null;
    const artistsRaw = row.artists || row.artist || "";
    const artist = artistsRaw
      .split(/;|,|&/)
      .map((s) => s.trim())
      .filter(Boolean);

    const album = row.album || row.album_name || null;

    // Audio features if available
    const audioFeatures = {
      danceability: row.danceability !== undefined ? Number(row.danceability) : null,
      energy: row.energy !== undefined ? Number(row.energy) : null,
      key: row.key !== undefined ? Number(row.key) : null,
      loudness: row.loudness !== undefined ? Number(row.loudness) : null,
      mode: row.mode !== undefined ? Number(row.mode) : null,
      speechiness: row.speechiness !== undefined ? Number(row.speechiness) : null,
      acousticness: row.acousticness !== undefined ? Number(row.acousticness) : null,
      instrumentalness:
        row.instrumentalness !== undefined ? Number(row.instrumentalness) : null,
      liveness: row.liveness !== undefined ? Number(row.liveness) : null,
      valence: row.valence !== undefined ? Number(row.valence) : null,
      tempo: row.tempo !== undefined ? Number(row.tempo) : null,
      duration_ms: row.duration_ms !== undefined ? Number(row.duration_ms) : null,
      time_signature:
        row.time_signature !== undefined ? Number(row.time_signature) : null,
      popularity: row.popularity !== undefined ? Number(row.popularity) : null,
    };

        // Filter by popularity before doing any further work
    // const popularityCutoff = 60; // adjust if you want
    // if (
    //   audioFeatures.popularity == null ||
    //   //albumArtUrl == null ||
    //   Number.isNaN(audioFeatures.popularity) ||
    //   audioFeatures.popularity < popularityCutoff
    // ) {
    //   continue; // skip this row entirely
    // }

    // Derive mood tags from Kaggle audio features
    const derivedMoodTags = inferMoodTags(audioFeatures);

    // Try to merge year, albumArt, and existing moodTags from previous JSON
    let year = null;
    const titleKey = (name || "").toLowerCase().trim();
    const artistKey = artist.join(",").toLowerCase().trim();
    const composite = `${titleKey}__${artistKey}`;

    let albumArt = null;
    let mergedMoodTags = [...derivedMoodTags];

    const existing = existingByTitleArtist[composite];
    if (existing) {
      if (existing.year != null) year = existing.year;
      if (existing.albumArt) albumArt = existing.albumArt;
      if (Array.isArray(existing.moodTags) && existing.moodTags.length > 0) {
        // Merge existing mood tags with derived ones, de-duplicated
        const set = new Set([...existing.moodTags, ...derivedMoodTags]);
        mergedMoodTags = Array.from(set);
      }
    }
    // if (!albumArtUrl) {
    //     continue;
    // }

    // If Kaggle provides year explicitly, prefer that when existing.year is null
    if (year == null && row.year !== undefined) {
      const parsedYear = Number(row.year);
      if (!Number.isNaN(parsedYear)) year = parsedYear;
    }

    // Genres: use Kaggle genre-like columns if present
    const genres = [];
    if (row.genre) genres.push(String(row.genre));
    if (row.subgenre) genres.push(String(row.subgenre));
    if (row.playlist_genre) genres.push(String(row.playlist_genre));
    if (row.playlist_subgenre) genres.push(String(row.playlist_subgenre));

    const uniqueGenres = [...new Set(genres.filter(Boolean))];

    normalized[id] = {
      id,
      sourceTrackId: row.track_id || row.id || null,
      name,
      artist,
      album,
      year: year,
      genres: uniqueGenres,
      country: null,
      language: null,
      moodTags: mergedMoodTags,
      audioFeatures,
      userTags: [],
      lyricsSnippet: null,
      embedding: null,
      albumArt: albumArt,
      // keep all raw Kaggle columns under a nested object for debugging/experiments
      kaggleRaw: row,
    };

    // Limit to a reasonable number if desired
    if (idx >= 300) break;
  }

  const outPath = path.resolve(baseDir, OUTPUT_JSON_RELATIVE);
  await fs.writeFile(outPath, JSON.stringify(normalized, null, 2), "utf8");
  console.log("Wrote", Object.keys(normalized).length, "songs to", outPath);
}

main().catch((err) => {
  console.error("Error generating songs from Kaggle:", err);
  process.exit(1);
});
