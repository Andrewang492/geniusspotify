import React from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useState, useEffect, useContext } from "react";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const fetchLyrics = (query, token) => {
  return fetch(
    `${backendUrl}/genius/search?queryString=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      return data;
    })
    .then((data) => {
      return fetch(
        `${backendUrl}/genius/referents?songId=${encodeURIComponent(data.song.id)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      return data;
    })
    .catch((e) => "not found");
};

const Lyrics = ({ spNowPlaying }) => {
  const { spotifyToken, spotifyRToken } = useContext(AuthContext);
  const [lyrics, setLyrics] = useState("");

  useEffect(() => {
    if (spNowPlaying.item) {
      fetchLyrics(spNowPlaying.item.name, spotifyToken).then((data) => {
        console.log("lyrics fetched:");
        console.log(data);
        setLyrics(String(data));
      });
    }
  }, [spNowPlaying]);

  return <div>{lyrics}</div>;
};

export default Lyrics;
