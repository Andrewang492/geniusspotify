const express = require("express");
const cookieParser = require("cookie-parser");
const generateRandomString = require("./scripts/randomString");
const geniusQuery = require("./scripts/geniusQuery");
const querystring = require("node:querystring");
require("dotenv").config();
const { redirect, set } = require("express/lib/response.js");

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

app.use(cookieParser());

app.get("/", (req, res) => {
  res.send(
    `<h1>Home page<h1> 
    <a href="/login"><button>login to spotify</button></a>
    <a href="/go"><button>get lyrics</button></a>
    <iframe src="https://www.youtube.com/embed/mij0fmZ7lGw?si=g5ghgoRcoUou5e9R" width="560" height="315" title="YouTube video player"></iframe>
    <iframe src="https://genius.com/Yungen-comfy-lyrics"></iframe>
    `
  );
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
  if (!accessToken) {
    res.send("No access token found");
    return;
  }
  return fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  })
    .then((fetchRes) => fetchRes.json())
    .then((body) => {
      if (body.context && body.item) {
        const queryString = geniusQuery(body);
        return fetch(
          `https://api.genius.com/search?` +
            querystring.stringify({ q: queryString }),
          {
            headers: {
              Authorization: "Bearer " + g_client_accessToken,
            },
          }
        );
      }
    })
    .then((geniusFetchRes) => geniusFetchRes.json())
    .then((object) => {
      console.log(`got genius response`);
      console.log(object);
      if (object.response.hits.length == 0) {
        throw new Error("No hits");
      }
      object.response.hits.forEach((element) => {
        console.log(element.result.full_title);
      });
      const apiPath = object.response.hits[0].result.api_path;

      return fetch(`https://api.genius.com${apiPath}?text_format=plain`, {
        headers: {
          Authorization: "Bearer " + g_client_accessToken,
        },
      });
    })
    .then((geniusFetchRes) => geniusFetchRes.json())
    .then((object) => {
      res.send(object.response.song.embed_content);
      // console.error(object.response.song.url);
      // console.error(`<iframe src="${object.response.song.url}"></iframe>`);

      // res.send(`<iframe src="${object.response.song.url}"></iframe>`);
    })
    .catch((e) => {
      console.error(`${Date.now()}:      logging from this block`);
      console.error(e);
      res.send(`Make sure to log in. Error: \n${e.toString()}`);
    });
});

app.listen(8080, () => {
  console.log(`App listening on \n ${baseurl}`);
});
