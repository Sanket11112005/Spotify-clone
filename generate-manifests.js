// generate-manifests.js
//
// Run this locally (not in the browser) whenever you add/remove albums or songs.
// It scans your Songs/ folder and writes:
//   - Songs/albums.json           (list of album folder names)
//   - Songs/<album>/songs.json    (list of .mp3 files in that album), for every album
//
// USAGE:
//   1. Place this file in the ROOT of your project (same level as index.html, Songs/)
//   2. Run:  node generate-manifests.js
//   3. Commit and push the updated .json files to GitHub
//
// Requires Node.js installed (https://nodejs.org) — no npm packages needed.

const fs = require("fs");
const path = require("path");

const SONGS_DIR = path.join(__dirname, "Songs");

if (!fs.existsSync(SONGS_DIR)) {
    console.error(`Could not find a "Songs" folder at: ${SONGS_DIR}`);
    console.error("Make sure this script sits in the same folder as your Songs/ directory.");
    process.exit(1);
}

// Get every subfolder inside Songs/ (each one is an album)
const albumFolders = fs.readdirSync(SONGS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

if (albumFolders.length === 0) {
    console.warn("No album folders found inside Songs/. Nothing to do.");
    process.exit(0);
}

// Write Songs/albums.json
const albumsManifestPath = path.join(SONGS_DIR, "albums.json");
fs.writeFileSync(albumsManifestPath, JSON.stringify({ folders: albumFolders }, null, 2));
console.log(`Wrote ${path.relative(__dirname, albumsManifestPath)} with ${albumFolders.length} album(s): ${albumFolders.join(", ")}`);

// For each album, write Songs/<album>/songs.json
albumFolders.forEach(folder => {
    const albumPath = path.join(SONGS_DIR, folder);
    const files = fs.readdirSync(albumPath, { withFileTypes: true })
        .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith(".mp3"))
        .map(entry => entry.name);

    const songsManifestPath = path.join(albumPath, "songs.json");
    fs.writeFileSync(songsManifestPath, JSON.stringify({ songs: files }, null, 2));

    if (files.length === 0) {
        console.warn(`  "${folder}": no .mp3 files found — wrote an empty songs.json`);
    } else {
        console.log(`  "${folder}": wrote songs.json with ${files.length} song(s)`);
    }
});

console.log("\nDone. Commit and push the updated .json files to GitHub, then republish.");
