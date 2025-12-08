import { useState, useEffect, createContext, useContext} from "react";
import "./App.css";
import queryString from "query-string";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from '@mui/material/Box';
import { Outlet, Link as RLink } from "react-router-dom";
import HomePage from "./components/pages/HomePage";
// import { useNowPlaying } from "./components/contexts/NowPlayingProvider";
import { AuthContext } from "./components/contexts/AuthContext";


const baseurl = "http://127.0.0.1:5173";
// const backendUrl = import.meta.env.REACT_APP_BASE_URL;

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
    `${encodeURIComponent(name)}=${encodeURIComponent(
      value
    )}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax` + secure;
};

const getCookie = (name) => {
  const match = document.cookie.match(
    new RegExp(
      "(^|; )" + name.replace(/([.*+?^${}()|[\]\\])/g, "\\$1") + "=([^;]*)"
    )
  );
  return match ? decodeURIComponent(match[2]) : null;
};

function App() {
  const { setSpotifyToken, setSpotifyRToken } = useContext(AuthContext);


  useEffect(() => {
    const hash = getTokenFromUrl();
    window.location.hash = "";
    var _token = hash.access_token;
    var _refresh_token = hash.refresh_token;
    console.log(`token from url: ${_token}`);
    console.log(`refresh token from url: ${_refresh_token}`);
    if (hash.error) {
      console.error(`error after login: ${hash.error}`)
    }

    if (!_token) { // try get token from cookie
      _token = getCookie("spotify_token");
      _refresh_token = getCookie("spotify_refresh_token");
    }

    // Then set contexts if we got token from either url or cookie:
    if (_token) {
      setSpotifyToken(_token);
      setSpotifyRToken(_refresh_token);


      // store access token for 1 hour and refresh token for 30 days
      setCookie("spotify_token", _token, 60 * 60); // Known to be 1 hour
      if (_refresh_token) {
        setCookie(
          "spotify_refresh_token",
          _refresh_token,
          30 * 24 * 60 * 60 * 12
        ); // 360 days
      }
    }
  }, []);


  return (
      <div id="main" style={{ display: "flex", flexDirection: "row" }}>
        <div id="left-main">
          <HomePage></HomePage>
          
        </div>
      </div>
  );
}

export default App;
