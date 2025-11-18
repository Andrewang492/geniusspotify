import React from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from '@mui/material/Box';
import { Outlet, Link as RLink } from "react-router-dom";

const HomePage = ({loggedIn, nowPlaying}) => {
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
          <Button variant="contained" onClick={() => getNowPlaying()}>
            Check Now Playing
          </Button>
        </>
      )}
    </div>
  );
};

export default HomePage;
