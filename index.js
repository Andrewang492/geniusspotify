const express = require("express");
const cookieParser = require("cookie-parser");
const generateRandomString = require("./scripts/randomString");
const {
  makeQuery,
  getArtistsNames,
  getGeniusAPIPath,
} = require("./scripts/geniusQuery");
const querystring = require("node:querystring");
require("dotenv").config();
const { redirect, set } = require("express/lib/response.js");
const path = require("path");

var app = express();
let state = null;
// let accessToken = null;
// let refreshToken = null;
const baseurl = process.env.BASE_URL;
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
var redirect_uri = `${baseurl}/callback`;
var scope = `
user-read-playback-state 
user-read-currently-playing
`;
// Genius variables:
const g_client_accessToken = process.env.G_CLIENT_ACCESS_TOKEN;

app.set("view engine", "ejs");

app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  // res.send(
  //   `<h1>Home page<h1>
  //   <a href="/login"><button>login to spotify</button></a>
  //   <a href="/go"><button>get lyrics</button></a>
  //   `
  // );
  const hasToken = req.cookies.accessToken ? true : false;
  const data = {
    title: "Genius for Spotify",
    message: hasToken ? "Genius for Spotify" : "Login to see lyrics!",
    loggedIn: hasToken,
  };
  res.render("home", data);
});

app.get("/login", function (req, res) {
  state = generateRandomString(16);

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
});

app.get("/logout", (req, res) => {
  console.log("LOGGIN OUT");
  res.clearCookie("accessToken");
  res.redirect("/");
});

app.get("/callback", (req, res) => {
  let code = req.query.code;
  if (state !== req.query.state) {
    console.error("the state string is not the same.");
    res.send("state error");
    return;
  }

  fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        new Buffer.from(client_id + ":" + client_secret).toString("base64"),
    }, //Buffer encodes the client id and secret.
    body: `code=${code}&redirect_uri=${redirect_uri}&grant_type=authorization_code`,
  })
    .then((fetchRes) => {
      return fetchRes.json();
    })
    .then((jsonRes) => {
      // accessToken = jsonRes.access_token;
      res.cookie("accessToken", jsonRes.access_token, {
        httpOnly: true, // HttpOnly flag
        secure: true, // Secure flag (ensure your server is running on HTTPS)
        maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expires in 7 days
      });

      res.redirect("/");
    })
    .catch((err) => {
      console.error("error with logging in to spotify.");
      console.error(`${err}`);
      res.send(err);
    });
});

app.get("/go", (req, res) => {
  const accessToken = req.cookies.accessToken;
  let queryString = "";
  let artistNames = "";
  if (!accessToken) {
    res.send("No access token found");
    return;
  }
  // Get currently playing
  return fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  })
    .then((fetchRes) => fetchRes.json())
    .then((body) => {
      if (body.context && body.item) {
        let { queryString, artistNames } = makeQuery(body);
        // Search genius
        console.log("");
        return fetch(
          `https://api.genius.com/search?` +
            querystring.stringify({ q: queryString }),
          {
            headers: {
              Authorization: "Bearer " + g_client_accessToken,
            },
          }
        );
      } else {
        // console.error(body);
        throw new Error(body.message);
      }
    })
    .then((geniusFetchRes) => geniusFetchRes.json())
    .then((object) => {
      const apiPath = getGeniusAPIPath(object, queryString);

      // Get actual lyrics response
      return fetch(`https://api.genius.com${apiPath}?text_format=plain`, {
        headers: {
          Authorization: "Bearer " + g_client_accessToken,
        },
      });
    })
    .then((geniusFetchRes) => geniusFetchRes.json())
    .then((object) => {
      const song = object.response.song;
      res.render("lyricsPage", {
        songid: song.id,
        url: song.url,
        full_title: song.full_title,
      });
    })
    .catch((e) => {
      console.error(`${Date.now()}: Error`);
      console.error(`token: ${accessToken}`);
      console.error(e);
      res.send(`Make sure to log in. Error: \n${e.toString()}`);
    });
});

app.get("/sanity", (req, res) => {
  res.send(
    `<div id='rg_embed_link_4836122' class='rg_embed_link' data-song-id='4836122'>
      Read 
      <a href='https://genius.com/Deko-phantasy-star-online-lyrics'>“Phantasy Star Online” by Deko</a>
      on Genius
    </div> 
    <script crossorigin src='//genius.com/songs/4836122/embed.js'></script>`
  );
});

app.listen(8080, () => {
  console.log(`App listening on \n ${baseurl}`);
});
