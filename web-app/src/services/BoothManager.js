import { MOCK_ROOMS, MOCK_USER } from "./mockData";
import spotifyManager from "./SpotifyManager";

class BoothManager {
  constructor() {
    this.booths = [...MOCK_ROOMS];
    this.currentUser = MOCK_USER;
    this.currentBooth = null;
  }

  getAllBooths() {
    return this.booths;
  }

  async createBooth(name, currentTrack) {
    // Ensure the user isn't already in another booth before creating and joing a new one
    if (this.currentBooth) {
      this.leaveBooth(this.currentBooth.id);
    }

    let track = currentTrack;

    if (!track) {
      try {
        const nowPlaying = await spotifyManager.getCurrentlyPlaying();
        track = {
          name: nowPlaying.name,
          artist: nowPlaying.artist,
          albumArt: nowPlaying.albumArt,
        };
      } catch (error) {
        track = {
          name: "No Track Playing",
          artist: "N/A",
          albumArt: "https://via.placeholder.com/200",
        };
      }
    }

    const newBooth = {
      id: `room${Date.now()}`,
      name: name || `${this.currentUser.displayName}'s Room`,
      participants: 1,
      currentTrack: track,
      creator: this.currentUser.id,
      members: [{ id: this.currentUser.id, displayName: this.currentUser.displayName }],
    };

    this.booths.unshift(newBooth);
    this.currentBooth = newBooth;
    return newBooth;
  }

  joinBooth(boothId) {
    const booth = this.booths.find((b) => b.id === boothId);
    if (!booth) {
      return null;
    }

    // Leave current booth before joining new one
    if (this.currentBooth && this.currentBooth.id !== boothId) {
      this.leaveBooth(this.currentBooth.id);
    }

    if (!booth.members) {
      booth.members = [];
    }

    const existingMember = booth.members.find((m) => m.id === this.currentUser.id);
    if (!existingMember) {
      booth.members.push({ id: this.currentUser.id, displayName: this.currentUser.displayName });
      booth.participants += 1;
    }

    this.currentBooth = booth;
    return booth;
  }

  leaveBooth(boothId) {
    const booth = this.booths.find((b) => b.id === boothId);
    if (!booth) {
      return false;
    }

    if (booth.members) {
      booth.members = booth.members.filter((m) => m.id !== this.currentUser.id);
      booth.participants = Math.max(0, booth.participants - 1);
    }

    if (this.currentBooth?.id === boothId) {
      this.currentBooth = null;
    }

    return true;
  }

  getCurrentBooth() {
    return this.currentBooth;
  }

  isInBooth(boothId) {
    const booth = this.booths.find((b) => b.id === boothId);
    return booth?.members?.some((m) => m.id === this.currentUser.id) || false;
  }
}

const boothManager = new BoothManager();
export default boothManager;
