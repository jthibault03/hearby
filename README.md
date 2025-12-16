# Hearby

**Hearby** is a mobile-first web application that connects to your Spotify data and lets you share what you're currently listening to with nearby music listeners. Discover what people around you are jamming to in real-time on an interactive OpenStreetMap-style view!

Our project consists only of a frontend application, and does not need any environment variables to fully function.

## Prerequisites

- Node.js 14.0 or later
- npm or yarn
- Modern web browser (Chrome, Safari, Firefox, Edge)
- Spotify Developer Account (for API credentials and mock data generation, though not necessary for the demo)

## Setup Instructions

### 1. Clone the Repository and `cd` into `web-app` directory.

```bash
git clone https://github.com/jthibault03/hearby.git
cd hearby/web-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`


### Future Enhancements

- [ ] Real Spotify SDK integration
- [ ] Backend service for user discovery
- [ ] Real-time WebSocket updates
- [ ] Friend system
- [ ] Social features
- [ ] Push notifications

## Technologies Used

- **React**: Modern UI framework
- **Leaflet.js**: Interactive maps with OpenStreetMap
- **JavaScript/ES6+**: Modern JavaScript features
- **CSS3**: Responsive mobile-first design
- **Browser APIs**: Geolocation, LocalStorage
- **Spotify Web API**: Music playback data (OAuth 2.0 + PKCE)

## License

This project is open source and available under the MIT License.

