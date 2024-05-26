const express = require("express");
const cookieParser = require("cookie-parser");
const generateRandomString = require("./scripts/randomString");
const querystring = require("node:querystring");
require("dotenv").config();
const { redirect } = require("express/lib/response.js");

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
let g_accessToken = null;
let g_refreshToken = null;
let g_state = null;
const g_client_id = process.env.G_CLIENT_ID;
const g_client_secret = process.env.G_CLIENT_SECRET;
var g_redirect_uri = `${baseurl}/g_callback`;
var g_scope = `me`;

app.use(cookieParser());

app.get("/", (req, res) => {
  res.send(
    `<h1>Home page<h1> 
    <a href="/login"><button>login to spotify</button></a>
    <a href="/go"><button>get lyrics</button></a>
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
/**
 * @deprecated
 */
app.get("/logingenius", function (req, res) {
  g_state = generateRandomString(16);

  res.redirect(
    "https://api.genius.com/oauth/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: g_client_id,
        scope: g_scope,
        redirect_uri: g_redirect_uri,
        state: g_state,
      })
  );
});

/**
 * @deprecated
 */
app.get("/g_callback", (req, res) => {
  let code = req.query.code;
  if (g_state !== req.query.state) {
    console.error("the state string is not the same.");
    res.send("state error");
    return;
  }

  fetch("https://api.genius.com/oauth/token", {
    method: "POST",
    // headers: {
    //   "content-type": "application/x-www-form-urlencoded",
    //   Authorization:
    //     "Basic " +
    //     new Buffer.from(g_client_id + ":" + g_client_secret).toString("base64"),
    // }, //Buffer encodes the client id and secret.
    body: querystring.stringify({
      code: code,
      client_secret: g_client_secret,
      grant_type: "authorization_code",
      client_id: g_client_id,
      redirect_uri: g_redirect_uri,
      response_type: "code",
    }),
  })
    .then((fetchRes) => {
      return fetchRes.json();
    })
    .then((jsonRes) => {
      g_accessToken = jsonRes.access_token;
      console.log(`genius accessToken ${accessToken}`);
      res.redirect("/");
    })
    .catch((err) => {
      console.error(
        "couldn't change genius to json or store a genius acces token."
      );
      console.error(`${err}`);
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
        const trackName = body.item.name;
        const artistName = body.item.artists
          .map((artistObject) => artistObject.name)
          .join(" ");
        console.log(`query is: ${trackName} ${artistName}`);
        return fetch(
          `https://api.genius.com/search?` +
            querystring.stringify({ q: `${trackName} ${artistName}` }),
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
      // res.send(`<iframe src="${object.response.}" title="description"></iframe>`)
    })
    .catch((e) => res.send(e));
});

app.listen(8080, () => {
  console.log(`App listening on \n ${baseurl}`);
});
