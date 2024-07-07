function removeBracketedText(str) {
  return str.replace(/\(.*?\)/g, "");
}

function extractWordsInBrackets(str) {
  // Regular expression to match text inside square, round, or curly brackets
  let regex = /\[(.*?)\]|\((.*?)\)|\{(.*?)\}/g;
  let matches;
  let words = [];

  // Find all matches
  while ((matches = regex.exec(str)) !== null) {
    // Extract words from each capturing group
    for (let i = 1; i <= 3; i++) {
      if (matches[i]) {
        words = words.concat(matches[i].split(/\s+/));
      }
    }
  }

  return words;
}

function removeSubstring(str, substring) {
  // Create a regular expression to match the substring
  // The 'g' flag is used for global replacement
  let regex = new RegExp(substring, "g");
  return str.replace(regex, "");
}

const featWords = ["feat", "feat.", "with", "featuring", "ft", "ft."];

function collectWordsBeforeFeat(str) {
  // Define the keywords to look for
  const keywords = featWords;

  const regex = new RegExp(`\\b(?:${keywords.join("|")})\\b`, "i");
  // Find the position of the first keyword
  const match = str.match(regex);
  // If no keyword is found, return the entire string split into words
  if (!match) {
    return str.split(/\s+/);
  }

  // Get the substring before the keyword
  const substringBeforeKeyword = str.slice(0, match.index);
  // Split the substring into words and return
  return substringBeforeKeyword.trim().split(/\s+/);
}

function collectWordsAfterFeat(str) {
  // Define the keywords to look for
  const keywords = featWords;

  // Create a regular expression to match any of the keywords
  const regex = new RegExp(`\\b(?:${keywords.join("|")})\\b`, "i"); // match boundary. Then a non-capture group matching any of the keywords. i sets it to be case insensitive.

  // Find the position of the first keyword
  const match = str.match(regex);

  // If no keyword is found, return an empty array
  if (!match) {
    return [];
  }

  // Get the substring after the keyword
  const substringAfterKeyword = str.slice(match.index + match[0].length);

  // Split the substring into words and return
  return substringAfterKeyword.trim().split(/\s+/);
}

function listToLowercase(list) {}

/**
 * Make a query to search into Genius.
 * @param {JSON Object} spotifyResponse A response from spotify regarding the currently playing song
 * @returns {String} a query string for Genius
 */
function makeQuery(spotifyResponse) {
  const body = spotifyResponse;
  const extraWords = collectWordsAfterFeat(body.item.name).map((word) =>
    word.replace(/[\[\]\{\}\(\)]/g, "").toLowerCase()
  );
  console.log(`extra words: ${extraWords}`);
  const trackName = collectWordsBeforeFeat(body.item.name)
    .map((word) => word.toLowerCase())
    .filter((word) => !new Set(["(", ")", "[", "]", "{", "}"]).has(word)) //remove brakcets
    .join(" ");

  let artistNames = getArtistsNames(spotifyResponse, extraWords);

  const queryString = `${trackName} ${artistNames}`;
  console.log(`query is: ${queryString}`);
  return {
    trackName,
    artistNames,
    queryString,
  };
}

function getArtistsNames(spotifyResponse, extraWords) {
  const body = spotifyResponse;
  return body.item.artists
    .map((artistObject) => artistObject.name.toLowerCase().split(" "))
    .reduce((prev, next) => [...prev, ...next], []) // Put names as individual artists.
    .filter((artist) => !new Set(extraWords).has(artist))
    .join(" ");
}

function getGeniusAPIPath(object, queryString, artistNames) {
  console.log(`got genius response`);
  console.log(object);
  console.log(queryString);

  // only select if artist in the genius page looks right.
  const results1 = object.response.hits.filter((e) => {
    console.log(e.result.primary_artist?.name.toLowerCase());
    return queryString.includes(e.result.primary_artist?.name.toLowerCase());
  });
  if (results1.length == 0 && object.response.hits.length == 0) {
    throw new Error("No hits");
  }
  results1.forEach((element) => {
    console.log(element.result.full_title);
    console.log(element.result.primary_artist?.name);
  });
  // try select filtered by artist. Else use the unfiltered results' first result.
  const apiPath = results1[0]
    ? results1[0].result.api_path
    : object.response.hits[0].result.api_path;
  return apiPath;
}

module.exports = { makeQuery, getGeniusAPIPath };

/**
 * @deprecated
 * Make a query to search into Genius.
 * @param {JSON Object} spotifyResponse A response from spotify regarding the currently playing song
 * @returns {String} a query string for Genius
 */
function makeQuery2(spotifyResponse) {
  const body = spotifyResponse;
  const features = extractWordsInBrackets(body.item.name).map((word) =>
    word.toLowerCase()
  );
  const trackName = removeBracketedText(body.item.name).toLowerCase();
  let artistNames = body.item.artists
    .map((artistObject) => artistObject.name.toLowerCase())
    .join(" ");
  features.forEach((feature) => {
    console.log(`removing ${feature}`);
    artistNames = removeSubstring(artistNames, feature);
    console.log(`${artistNames}`);
  });
  const queryString = `${trackName} ${artistNames}`;
  console.log(`query is: ${queryString}`);
  return queryString;
}
