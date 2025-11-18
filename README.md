# Hearby 🎵

**Hearby** is a mobile social iOS app that connects to your Spotify data and lets you share what you're currently listening to with nearby music listeners. Discover what people around you are jamming to in real-time on an interactive OpenStreetMap-style view!

## Features

✨ **Core Features:**
- 🎧 **Spotify Integration**: Connect your Spotify account to share what you're listening to
- 📍 **Location-Based Discovery**: See nearby listeners on an interactive map
- 🗺️ **OpenStreetMap Style View**: Beautiful map interface showing your current location and city
- 🎵 **Real-Time Music Sharing**: Display current playing tracks from Spotify
- 👥 **Nearby Listeners**: Discover what music fans around you are listening to
- 🔒 **Privacy-Focused**: Location permissions and data handling built with privacy in mind

## Architecture

The app is built using native iOS technologies:

### Key Components

1. **SpotifyManager**: Handles Spotify OAuth authentication and playback data
2. **LocationManager**: Manages location services and permissions
3. **MapViewController**: Main view with map and nearby listeners
4. **Models**: Data structures for User, Track, Location, and NearbyListener

### File Structure

```
Hearby/
├── Hearby/
│   ├── AppDelegate.swift              # App lifecycle management
│   ├── SceneDelegate.swift            # Scene management and navigation
│   ├── Models.swift                   # Data models
│   ├── SpotifyManager.swift           # Spotify integration
│   ├── LocationManager.swift          # Location services
│   ├── SpotifyAuthViewController.swift # Spotify authentication UI
│   ├── MapViewController.swift         # Main map view
│   ├── UIComponents.swift             # Reusable UI components
│   └── Info.plist                     # App configuration
└── Hearby.xcodeproj/                  # Xcode project
```

## Prerequisites

- iOS 14.0 or later
- Xcode 12.0 or later
- Spotify Developer Account (for API credentials)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/jthibault03/hearby.git
cd hearby
```

### 2. Configure Spotify Credentials

1. Create a Spotify Developer account at [developer.spotify.com](https://developer.spotify.com)
2. Create a new app in your Spotify Developer Dashboard
3. Add `hearby://spotify-callback` to your Redirect URIs
4. Update `SpotifyManager.swift` with your credentials:

```swift
private let clientId = "YOUR_SPOTIFY_CLIENT_ID"
```

### 3. Open in Xcode

```bash
open Hearby/Hearby.xcodeproj
```

### 4. Build and Run

- Select a simulator or connected device
- Press `Cmd + R` to build and run

## Usage

1. **First Launch**: Tap "Connect with Spotify" to authenticate
2. **Grant Permissions**: Allow location access when prompted
3. **Explore**: View the map showing your location and nearby listeners
4. **Discover**: Tap on map annotations to see what others are listening to
5. **Share**: Your currently playing track is displayed at the bottom

## Configuration

### Info.plist Settings

The app requires the following permissions:
- `NSLocationWhenInUseUsageDescription`: For showing your location on the map
- `NSLocationAlwaysAndWhenInUseUsageDescription`: For continuous location updates
- URL Scheme: `hearby://` for Spotify OAuth callback

## Development

### Mock Data

The current implementation includes mock data for demonstration:
- Mock Spotify authentication flow
- Sample nearby listeners
- Example tracks

For production, you'll need to:
1. Implement actual Spotify API calls
2. Set up a backend service for user discovery
3. Implement real-time data synchronization

### Future Enhancements

- [ ] Real Spotify SDK integration
- [ ] Backend service for user discovery
- [ ] Real-time WebSocket updates
- [ ] Friend system
- [ ] Music recommendations based on nearby listeners
- [ ] Social features (like, comment, share)
- [ ] Privacy controls (invisible mode, radius control)

## Technologies Used

- **Swift**: Native iOS development
- **UIKit**: UI framework
- **MapKit**: Map display and annotations
- **CoreLocation**: Location services
- **Spotify Web API**: Music playback data (to be integrated)

## Security & Privacy

- Location data is only used for displaying on the map
- Spotify authentication uses OAuth 2.0
- No personal data is stored permanently
- Users can disconnect at any time

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Built with ❤️ for music lovers everywhere