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

/**
 * Make a query to search into Genius.
 * @param {JSON Object} spotifyResponse A response from spotify regarding the currently playing song
 */
function makeQuery(spotifyResponse) {
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
}

module.exports = makeQuery;
