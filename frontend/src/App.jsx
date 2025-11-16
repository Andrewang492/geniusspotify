import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Outlet, Link } from "react-router-dom";
import queryString from "query-string";
import SpotifyWebApi from "spotify-web-api-js";

const spotifyApi = new SpotifyWebApi();

const baseurl = "http://127.0.0.1:5173";
const backendUrl = "http://localhost:8080";
const client_id = "5e6209bc2f3e4169811f798f5ffa2086";
const client_secret = "fad48b45176541de944c8f47b8d3f624";
var redirect_uri = `${baseurl}/redirect`;
var scope = `
user-read-playback-state 
user-read-currently-playing
`;
let state = null;

const getTokenFromUrl = () => {
  const tokens = window.location.hash
    .substring(1)
    .split("&")
    .reduce((initial, item) => {
      let parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
      return initial;
    }, {});
  return tokens;
};

const setCookie = (name, value, maxAgeSeconds) => {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax` +
    secure;
};

const getCookie = (name) => {
  const match = document.cookie.match(
    new RegExp("(^|; )" + name.replace(/([.*+?^${}()|[\]\\])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[2]) : null;
};

function App() {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [spotifyRToken, setSpotifyRToken] = useState("");
  const [nowPlaying, setNowPlaying] = useState({});
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const hash = getTokenFromUrl();
    window.location.hash = "";
    var _token = hash.access_token;
    console.log(`token from url: ${_token}`);
    var _refresh_token = hash.refresh_token;
    console.log(`refresh token from url: ${_refresh_token}`);

    if (!_token) {
      _token = getCookie("spotify_token");
      _refresh_token = getCookie("spotify_refresh_token");
    }

    // Then do something if we got token from either url or cookie:
    if (_token) {
      setSpotifyToken(_token);
      setSpotifyRToken(_refresh_token);
      spotifyApi.setAccessToken(_token);
      setLoggedIn(true);

      // store access token for 1 hour and refresh token for 30 days
      setCookie("spotify_token", _token, 60 * 60); // Known to be 1 hour
      if (_refresh_token) {
        setCookie("spotify_refresh_token", _refresh_token, 30 * 24 * 60 * 60 * 12); // 360 days
      }
    }
  }, []);

  useEffect(() => {
    if (!spotifyToken) return;

    // fetch once immediately
    getNowPlaying(spotifyToken);

    // poll every 15s to keep now-playing up to date
    const intervalId = setInterval(() => {
      getNowPlaying(spotifyToken);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [spotifyToken]);

  // const getNowPlaying = () => {
  //   spotifyApi.getMyCurrentPlaybackState().then((response) => {
  //     console.log(response);
  //     setNowPlaying({
  //       name: response.item.name,
  //       albumArt: response.item.album.images[0].url,
  //     });
  //   });
  // };
  const getNowPlaying = () => {
    fetch(`${backendUrl}/np?access_token=${spotifyToken}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setNowPlaying({
          name: data.item.name,
          albumArt: data.item.album.images[0].url,
        });
      })
  };
  
  function onLoginClick() {
    window.open(backendUrl, "_blank"); // TODO dynamic to backend url
  }

  return (
    <div id="main" style={{ display: "flex", flexDirection: "row" }}>
      <div id="left-main">
        <div>
          <a href="https://vitejs.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Vite + React</h1>
        <div className="card">
          <p>
            Edit <code>src/App.jsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link to={`redirect`}>redirect page</Link>
          <Link to={`user`}>show user</Link>
          {!loggedIn && (
            <button onClick={() => onLoginClick()} target="_blank">
              login to spotify
            </button>
          )}
          {loggedIn && (
            <>
              <div>Now Playing: {nowPlaying.name} </div>
              <div>
                <img src={nowPlaying.albumArt} style={{ height: 150 }}></img>
              </div>
              <button onClick={() => getNowPlaying()}>
                Check Now Playing
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
