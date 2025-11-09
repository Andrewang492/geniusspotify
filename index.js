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
  res.clearCookie("refreshToken");
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
      // set your accessToken:
      res.cookie("accessToken", jsonRes.access_token, {
        httpOnly: true, // HttpOnly flag
        secure: true, // Secure flag (ensure your server is running on HTTPS)
        maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expires in 7 days
      });
      res.cookie("refreshToken", jsonRes.refresh_token, {
        httpOnly: true,
        secure: true,
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
  fetch("https://api.spotify.com/v1/me/player/currently-playing", {
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
      console.log(`Query string: ${queryString}`);
      console.log(queryString); // TODO seems like queryString is not defined here?
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
      // Render lyrics page
      const song = object.response.song;
      res.render("lyricsPageDefault", {
        songid: song.id,
        url: song.url,
        full_title: song.full_title,
        header_image_thumbnail_url: song.header_image_thumbnail_url,
        header_image_url: song.header_image_url,
        song_art_image_thumbnail_url: song.song_art_image_thumbnail_url,
        song_art_image_url: song.song_art_image_url,
        primary_artist_header_image_url: song.primary_artist?.header_image_url,
        primary_artist_image_url: song.primary_artist?.image_url,
      });
    })
    .catch((e) => {
      console.error(`${Date.now()}: Error`);
      console.error(`token: ${accessToken}`);
      console.error(e);
      res.render("error", { message: e.toString() });
    });
});

app.get("/sanity", (req, res) => {
  // res.send(
  //   `<div id='rg_embed_link_4836122' class='rg_embed_link' data-song-id='4836122'>
  //     Read 
  //     <a href='https://genius.com/Deko-phantasy-star-online-lyrics'>“Phantasy Star Online” by Deko</a>
  //     on Genius
  //   </div> 
  //   <script crossorigin src='//genius.com/songs/4836122/embed.js'></script>`
  // );
  res.render("sanity2", {
  });
});

app.get("/refresh_token", (req, res) => {
  // var refresh_token = req.query.refresh_token;
  // var authOptions = {
  //   url: 'https://accounts.spotify.com/api/token',
  //   headers: {
  //     'content-type': 'application/x-www-form-urlencoded',
  //     'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
  //   },
  //   form: {
  //     grant_type: 'refresh_token',
  //     refresh_token: refresh_token
  //   },
  //   json: true
  // };

  const refresh_token = req.cookies.refreshToken;
  getRefreshToken(refresh_token)
    .then((body) => {
      console.log(body);
      res.send({
        access_token: body.access_token,
        refresh_token: body.refresh_token,
      });
    })
    .catch((e) => {
      res.send(e.toString());
    });

  // request.post(authOptions, function(error, response, body) {
  //   if (!error && response.statusCode === 200) {
  //     var access_token = body.access_token,
  //         refresh_token = body.refresh_token;
  //     res.send({
  //       'access_token': access_token,
  //       'refresh_token': refresh_token
  //     });
  //   }
  // });
  // res.send("hiiii");
});

app.listen(8080, () => {
  console.log(`App listening on \n ${baseurl}`);
});

const getRefreshToken = async (refreshToken) => {
  console.log(`refresh token ${refreshToken}`);
  const url = "https://accounts.spotify.com/api/token";
  const payload = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id,
    }),
  };
  return fetch(url, payload)
    .then((respon) => {
      console.log(respon);
      return respon.json();
    })
    .then((response) => {
      console.log(response);
      return {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      };
    })
    .catch((e) => {
      console.error(`some error in getRefreshToken`);
      console.error(e);
    });
};
