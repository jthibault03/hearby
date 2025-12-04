// Wrapper around generated Spotify mock data.
// Run `npm run fetch:songs` to regenerate `mockSongData.generated.json`.

import generated from "./mockSongData.generated.json";

export const MOCK_SONGS = generated;

export const getSongById = (id) => {
  return MOCK_SONGS[id] || null;
};
