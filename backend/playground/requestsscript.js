const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Go to the Genius lyrics page
  // await page.goto("https://genius.com/Osamason-rehhab-lyrics", { waitUntil: "networkidle" });
  await page.goto("https://genius.com/songs/378195/embed.js", { waitUntil: "networkidle" });
  console.log(page.url());
  console.log("Page loaded");
  // Extract lyrics
  // const lyrics = await page.$$eval(
  //   'div[data-lyrics-container="true"]',
  //   nodes => nodes.map(n => n.innerText).join("\n\n")
  // );

  // console.log(lyrics);

  await browser.close();
})();

// (async () => {
//   const browser = await chromium.launch({ headless: true });
//   const page = await browser.newPage();

//   // Go to the Genius lyrics page
//   await page.goto("127.0.0.1:8080/genius/sanity", { waitUntil: "networkidle" });
//   console.log(page.url());
//   console.log("Page loaded");
//   await page.waitForTimeout(3000);
//   // Extract lyrics
//   const lyrics = await page.$$eval(
//     'div',
//     nodes => nodes.map(n => n.innerText).join("\n\n")
//   );

//   console.log(lyrics);

//   await browser.close();
// })();


// (async () => {
//   const browser = await chromium.launch({ headless: true });
//   const page = await browser.newPage();

//   // Go to the Genius lyrics page
//   await page.goto("https://jsonplaceholder.typicode.com/", { waitUntil: "networkidle" });

//   console.log("Page loaded");
//   // Extract lyrics
//   const lyrics = await page.$$eval(
//     '.bg-blue-500',
//     nodes => nodes.map(n => n.innerText).join("\n\n")
//   );

//   console.log(lyrics);

//   await browser.close();
// })();
