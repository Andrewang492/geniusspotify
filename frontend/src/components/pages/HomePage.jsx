import React from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from '@mui/material/Box';
import { Outlet, Link as RLink } from "react-router-dom";
import { useState, useEffect, useContext} from "react";
import {TokenContext} from "../../App.jsx";

const backendUrl = import.meta.env.VITE_BACKEND_URL;


function onLoginClick() {
  // window.open(backendUrl, "_blank");
  window.location.href = backendUrl;
}


const HomePage = () => {
  const { spotifyToken, spotifyRToken} = useContext(TokenContext)
  const [nowPlaying, setNowPlaying] = useState({});
  const loggedIn = spotifyToken ? true : false;
  // const spotifyToken = "dfdfd"

  const fetchNowPlaying = () => {
    fetch(`${backendUrl}/np?access_token=${spotifyToken}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setNowPlaying({
          name: data.item.name,
          albumArt: data.item.album.images[0].url,
        });
      });
  };

  useEffect(() => {
    if (!spotifyToken) return;

    // fetch once immediately
    fetchNowPlaying(spotifyToken);

    // poll every 15s to keep now-playing up to date
    const intervalId = setInterval(() => {
      fetchNowPlaying(spotifyToken);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [spotifyToken]);



  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ width: "100%" }}>
        <Stack spacing={2}>
          <RLink to={`redirect`}>
            <Button variant="contained">Redirect Page</Button>
          </RLink>
          <RLink to={`user`}>
            <Button variant="contained">Show User</Button>
          </RLink>
        </Stack>
      </Box>

      {!loggedIn && (
        <Button
          variant="contained"
          onClick={() => onLoginClick()}
          target="_blank"
        >
          login to spotify
        </Button>
      )}
      {loggedIn && (
        <>
          <div>Now Playing: {nowPlaying.name} </div>
          <div>
            <img src={nowPlaying.albumArt} style={{ height: 150 }}></img>
          </div>
          <Button variant="contained" onClick={() => fetchNowPlaying()}>
            Check Now Playing
          </Button>
        </>
      )}
    </div>
  );
};

export default HomePage;
