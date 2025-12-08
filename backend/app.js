/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/documentation/web-api/tutorials/code-flow
 */

var express = require("express");
var request = require("request");
var crypto = require("crypto");
var cors = require("cors");
var querystring = require("querystring");
var cookieParser = require("cookie-parser");
require("dotenv").config();

const {
  makeQuery,
  getArtistsNames,
  getGeniusAPIPath,
  getGeniusBestMatchSongId,
} = require("../scripts/geniusQuery"); //TODO change path.
// var SpotifyWebApi = require("spotify-web-api-js"); // TODO never figured out how to use, the response from functions are not http responses.
// const spotifyApi = new SpotifyWebApi();//
var app = express();

app
  .use(express.static(__dirname + "/public"))
  .use(cors())
  .use(cookieParser());

const baseurl = `http://${process.env.HOST}:${process.env.PORT}`;
// const baseurl = process.env.BASE_URL;
const frontendurl = process.env.FRONTEND_URL;
var client_id = process.env.CLIENT_ID; // your clientId
var client_secret = process.env.CLIENT_SECRET; // Your secret
var redirect_uri = `${baseurl}/callback`;

const g_client_accessToken = process.env.G_CLIENT_ACCESS_TOKEN;
var g_client_id = process.env.G_CLIENT_ID;
var g_client_secret = process.env.G_CLIENT_SECRET;
var g_redirect_uri = `${baseurl}/gcallback`;

const generateRandomString = (length) => {
  return crypto.randomBytes(60).toString("hex").slice(0, length);
};

var stateKey = "spotify_auth_state";

//------------------------------
// Spotify Authentication
//------------------------------
app.get("/login", function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = "user-read-private user-read-email user-read-playback-state";
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

app.get("/callback", function (req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          new Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token,
          refresh_token = body.refresh_token;

        var options = {
          url: "https://api.spotify.com/v1/me",
          headers: { Authorization: "Bearer " + access_token },
          json: true,
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there !!!!!!!!!!!
        res.redirect(
          `${frontendurl}/#` +
            querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token,
            })
        );
      } else {
        res.redirect(
          `${frontendurl}/#` +
            querystring.stringify({
              error: "invalid_token",
            })
        );
      }
    });
  }
});

app.get("/refresh_token", function (req, res) {
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        new Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token,
        refresh_token = body.refresh_token;
      res.send({
        access_token: access_token,
        refresh_token: refresh_token,
      });
    }
  });
});

//------------------------------
// Genius Authentication (UNUSED)
//------------------------------
const gStateKey = "genius_auth_state";
app.get("/glogin", function (req, res) {
  var state = generateRandomString(16);
  res.cookie(gStateKey, state);
  var scope = "me";

  // your application requests authorization
  res.redirect(
    "https://api.genius.com/oauth/authorize?" +
      querystring.stringify({
        client_id: g_client_id,
        scope: scope,
        redirect_uri: g_redirect_uri,
        state: state,
        response_type: "code",
      })
  );
});

app.get("/glogin2", function (req, res) {
  const authUrl = 'https://api.genius.com/oauth/token';
  const authHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${btoa(`${g_client_id}:${g_client_secret}`)}`,
  };
  const authData = {
    grant_type: 'client_credentials',
  };
  fetch(authUrl, {
    method: 'POST',
    headers: authHeaders,
    body: new URLSearchParams(authData),
  }).then((response) => response.json()).then((data) => {
    //  res.redirect(
    //       `${frontendurl}/#` +
    //         querystring.stringify({
    //           g_access_token: data.access_token,
    //         })
    //     );
    console.log(data)
  }).catch((e) => {
    console.error('failed glogin2')
    console.error(e)
  })
});

app.get("/gcallback", function (req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[gStateKey] : null;
  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    res.clearCookie(gStateKey);
    var authOptions = {
      url: "https://api.genius.com/oauth/token",
      form: {
        code: code,
        client_secret: g_client_secret,
        grant_type: "authorization_code",
        client_id: g_client_id,
        redirect_uri: g_redirect_uri,
        response_type: "code",
      },
      // headers: {
      //   'content-type': 'application/x-www-form-urlencoded',
      //   Authorization: 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
      // },
      // json: true
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token,
          refresh_token = body.refresh_token;
        // we can also pass the token to the browser to make requests from there !!!!!!!!!!!
        res.redirect(
          `${frontendurl}/#` +
            querystring.stringify({
              g_access_token: access_token,
              g_refresh_token: refresh_token,
            })
        );
      } else {
        console.error(`auth error ${response.statusCode}: ${error}`);
        console.error(error)
        // res.redirect(
        //   `${frontendurl}/#` +
        //     querystring.stringify({
        //       error,
        //     })
        // );
      }
    });
  }
});

app.get("/refresh_token", function (req, res) {});

//------------------------------
// Spotify Calls
//------------------------------

app.get("/np", (req, res) => {
  const access_token = req.query.access_token;

  // Get currently playing
  fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: {
      Authorization: "Bearer " + access_token,
    },
  })
    .then((fetchRes) => fetchRes.json())
    .then((data) => res.send(data))
    .catch((e) => res.send(e.toString()));
});

//------------------------------
// Genius Calls
// -----------------------------

// Searches, then returns song information for the search.
app.get("/genius/search", (req, res) => {
  const queryString = req.query.queryString;
  fetch(
    `https://api.genius.com/search?` +
      querystring.stringify({ q: queryString }),
    {
      headers: {
        Authorization: "Bearer " + g_client_accessToken,
      },
    }
  )
    .then((geniusFetchRes) => geniusFetchRes.json())
    .then((object) => {
      const songId = getGeniusBestMatchSongId(object, queryString);

      // Get actual song response
      return fetch(`https://api.genius.com/songs/${songId}?text_format=plain`, {
        headers: {
          Authorization: "Bearer " + g_client_accessToken,
        },
      });
    })
    .then((geniusFetchRes) => geniusFetchRes.json())
    .then((object) => {
      res.send(object.response);
    })
    .catch((e) => res.send(e.toString()));
});

// Using a song id, get referents.
app.get("/genius/referents", (req, res) => {
  const song_id = req.query.songId;
  fetch(
    `https://api.genius.com/referents?` + querystring.stringify({ song_id }),
    {
      headers: {
        Authorization: "Bearer " + g_client_accessToken,
      },
    }
  )
    .then((geniusFetchRes) => geniusFetchRes.json())
    .then((object) => {
      res.send(object.response);
    })
    .catch((e) => res.send(e.toString()));
});

console.log(`Listening on ${baseurl}`);
app.listen(process.env.PORT, `${process.env.HOST}`);
