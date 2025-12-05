export const MOCK_USER = {
  id: "current-user",
  displayName: "You",
  username: "demo_user",
  location: { latitude: 37.8715, longitude: -122.273, city: "Berkeley" }, // Downtown Berkeley
};

export const MOCK_LISTENERS = [
  {
    id: 1,
    displayName: "Sarah M.",
    username: "sarah_m",
    isFriend: true,
    zoneId: "downtown",
    location: {
      latitude: 37.8715,
      longitude: -122.273,
      city: "Berkeley",
    },
    trackId: "song87",
  },
  {
    id: 2,
    displayName: "Mike J.",
    username: "mike_j",
    isFriend: false,
    zoneId: "downtown",
    location: {
      latitude: 37.872,
      longitude: -122.274,
      city: "Berkeley",
    },
    trackId: "song86",
  },
  {
    id: 3,
    displayName: "Emma L.",
    username: "emma_l",
    isFriend: true,
    zoneId: "campus",
    location: {
      latitude: 37.875,
      longitude: -122.258,
      city: "Berkeley",
    },
    trackId: "song85",
  },
  {
    id: 4,
    displayName: "Alex R.",
    username: "alex_r",
    isFriend: false,
    zoneId: "campus",
    location: {
      latitude: 37.874,
      longitude: -122.259,
      city: "Berkeley",
    },
    trackId: "song84",
  },
  {
    id: 5,
    displayName: "David K.",
    username: "david_k",
    isFriend: false,
    zoneId: "north",
    location: {
      latitude: 37.878,
      longitude: -122.27,
      city: "Berkeley",
    },
    trackId: "song83",
  },
  {
    id: 6,
    displayName: "Jessica T.",
    username: "jess_t",
    isFriend: false,
    zoneId: "south",
    location: {
      latitude: 37.865,
      longitude: -122.26,
      city: "Berkeley",
    },
    trackId: "song82",
  },
  {
    id: 7,
    displayName: "Ryan P.",
    username: "ryan_p",
    isFriend: false,
    zoneId: "downtown",
    location: {
      latitude: 37.8705,
      longitude: -122.269,
      city: "Berkeley",
    },
    trackId: "song81",
  },
  {
    id: 8,
    displayName: "Chloe B.",
    username: "chloe_b",
    isFriend: true,
    zoneId: "north",
    location: {
      latitude: 37.88,
      longitude: -122.275,
      city: "Berkeley",
    },
    trackId: "song13",
  },
  {
    id: 9,
    displayName: "Sam W.",
    username: "sam_w",
    isFriend: false,
    zoneId: "campus",
    location: {
      latitude: 37.873,
      longitude: -122.262,
      city: "Berkeley",
    },
    trackId: "song2",
  },
  {
    id: 10,
    displayName: "Maya S.",
    username: "maya_s",
    isFriend: false,
    zoneId: "south",
    location: {
      latitude: 37.863,
      longitude: -122.258,
      city: "Berkeley",
    },
    trackId: "song3",
  },
  {
    id: 11,
    displayName: "Jordan L.",
    username: "jordan_l",
    isFriend: false,
    zoneId: "downtown",
    location: {
      latitude: 37.8695,
      longitude: -122.271,
      city: "Berkeley",
    },
    trackId: "song4",
  },
  {
    id: 12,
    displayName: "Kevin H.",
    username: "kevin_h",
    isFriend: true,
    zoneId: "campus",
    location: {
      latitude: 37.876,
      longitude: -122.261,
      city: "Berkeley",
    },
    trackId: "song5",
  },
  {
    id: 13,
    displayName: "Marcus T.",
    username: "marcus_t",
    isFriend: false,
    zoneId: "downtown",
    location: {
      latitude: 37.8718,
      longitude: -122.272,
      city: "Berkeley",
    },
    trackId: "song6",
  },
  {
    id: 14,
    displayName: "Nina P.",
    username: "nina_p",
    isFriend: true,
    zoneId: "campus",
    location: {
      latitude: 37.8745,
      longitude: -122.260,
      city: "Berkeley",
    },
    trackId: "song7",
  },
];

export const MOCK_FRIENDS = [
  {
    id: "1",
    displayName: "Sarah M.",
    username: "sarah_spotify",
    isOnline: true,
  },
  { id: "3", displayName: "Emma L.", username: "emma_spotify", isOnline: true },
  { id: "6", displayName: "David K.", username: "david_k", isOnline: false },
  { id: "7", displayName: "Lisa P.", username: "lisa_p", isOnline: false },
];

export const MOCK_ROOMS = [
  {
    id: "room1",
    name: "Marina Chill",
    participants: 12,
    currentTrack: {
      name: "Passionfruit",
      artist: "Drake",
      albumArt:
        "data:image/jpeg;base64,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",
    },
  },
  {
    id: "room2",
    name: "Cal Study Vibes",
    participants: 8,
    currentTrack: {
      name: "Lo-Fi Beats",
      artist: "Unknown",
      albumArt: "https://picsum.photos/seed/lofi/200",
    },
  },
  {
    id: "room3",
    name: "Telegraph Ave Hits",
    participants: 25,
    currentTrack: {
      name: "Cruel Summer",
      artist: "Taylor Swift",
      albumArt:
        "data:image/jpeg;base64,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",
    },
  },
];
