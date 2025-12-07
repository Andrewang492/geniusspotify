import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Template = () => {
  const { spotifyToken, setSpotifyToken, spotifyRToken, setSpotifyRToken } =
    useContext(AuthContext);
  const fetchNowPlaying = () => {
    fetch(`${backendUrl}/np?access_token=${spotifyToken}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setNowPlaying(data);
        // setNowPlaying({
        //   name: data.item.name,
        //   albumArt: data.item.album.images[0].url,
        // });
      });
  };
  return <div>Template</div>;
};

export default Template;
