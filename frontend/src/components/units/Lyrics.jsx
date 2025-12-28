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

const fetchExample = (token) => {
  return fetch(
  `${backendUrl}/genius/sanity`,
  {
    headers: {
      Authorization: `Bearer ${token}`, // TODO token shouldn't be necessary anyway.
    },
  }
  )
}

const fetchExampleScript = (token) => {
  return fetch(
  `https://genius.com/songs/378195/embed.js`, // NOTE blocked by CORS
  {
    headers: {
      Authorization: `Bearer ${token}`, // TODO token shouldn't be necessary anyway.
    },
  }
  )
}

const Lyrics = ({ spNowPlaying }) => {
  const { spotifyToken, spotifyRToken } = useContext(AuthContext);
  const [lyrics, setLyrics] = useState("");

  useEffect(() => {
    if (spNowPlaying.item) {
      // fetchLyrics(spNowPlaying.item.name, spotifyToken).then((data) => {
      fetchExample(spotifyToken).
      then((res => res.text())).
      then((data) => {
        console.log("lyrics fetched:");
        console.log(data);
        setLyrics(String(data));
      });
    }
  }, [spNowPlaying]);

  // return <div>{lyrics}</div>;
  return <div>
    {/* <div dangerouslySetInnerHTML={{ __html: lyrics }} /> */}
    <div id='rg_embed_link_4836122' className='rg_embed_link' data-song-id='4836122'>
      Read 
      <a href='https://genius.com/Deko-phantasy-star-online-lyrics'>“Phantasy Star Online” by Deko</a>
      on Genius
    </div> 
    <script crossOrigin src="//genius.com/songs/4836122/embed.js"> </script>
  </div> 
};

export default Lyrics;
