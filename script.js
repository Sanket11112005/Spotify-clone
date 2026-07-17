console.log("Javascript is working!");
let currentSong = new Audio();
let songs;
let currFolder;

// CHANGE THESE IF YOUR REPO NAME OR USERNAME EVER CHANGES
const OWNER = "Sanket11112005";
const REPO = "Spotify-clone";
const SONGS_ROOT = "Songs"; // matches the capital "S" folder in your repo

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formatedMinutes = String(minutes).padStart(2, '0');
    const formatedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formatedMinutes}:${formatedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;

    // Ask GitHub's API what files exist inside this folder (e.g. "Songs/ncs")
    let a = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${folder}`);
    let files = await a.json();

    songs = files
        .filter(file => file.name.toLowerCase().endsWith(".mp3"))
        .map(file => file.name);

    //Show all the songs in the playlist
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li><img class="invert" src="images/music.svg" alt="">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>Song Artist</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="images/play.svg" alt="">
            </div> </li>`;
    }

    //Attatch an event listner to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        })
    })

    return songs;
}

const playMusic = (track, pause = false) => {
    // No leading slash: keeps this working under a GitHub Pages subpath like /Spotify-clone/
    currentSong.src = `${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "images/pause.svg"
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    console.log("displaying albums");

    // Ask GitHub's API what's inside the Songs folder (each album is a subfolder)
    let a = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${SONGS_ROOT}`);
    let items = await a.json();

    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    // Only keep entries that are actual folders (albums)
    let albumFolders = items.filter(item => item.type === "dir");

    for (const item of albumFolders) {
        let folder = item.name;

        try {
            // Get info.json's metadata from the API (content comes back base64-encoded)
            let infoResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${SONGS_ROOT}/${folder}/info.json`);
            if (!infoResponse.ok) {
                continue; // skip folders that don't have info.json
            }
            let infoData = await infoResponse.json();
            let info = JSON.parse(atob(infoData.content));

            // Cover image is a normal static file — fetch it directly, no leading slash
            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="${SONGS_ROOT}/${folder}/cover.jpg" alt="">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                </div>
            `;
        } catch (error) {
            console.log(`Could not load info for folder: ${folder}`, error);
        }
    }

    // When a card is clicked, load that album's songs
    let cards = document.getElementsByClassName("card");
    for (let card of cards) {
        card.addEventListener("click", async (e) => {
            let folder = e.currentTarget.dataset.folder;
            songs = await getSongs(`${SONGS_ROOT}/${folder}`);
            playMusic(songs[0]);
        });
    }
}

async function main() {

    //Get the list of all the songs
    await getSongs(`${SONGS_ROOT}/ncs`);
    playMusic(songs[0], true);

    //Display all the albums on the page
    await displayAlbums();

    //Attatch an event listner to play, next and previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "images/pause.svg";
        }
        else {
            currentSong.pause();
            play.src = "images/play.svg"
        }
    })

    //Listen for time update event
    currentSong.addEventListener("timeupdate", () => {
        console.log(currentSong.currentTime, currentSong.duration);
        document.querySelector(".songtime").innerHTML = `${formatTime(currentSong.currentTime)}/${formatTime(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    //Add an event listner to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    })

    //Add an event listner for hamburger{}
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = 0;
    })

    //Add an event listner for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    })

    //Add event listner to previous and next 
    previous.addEventListener("click", () => {
        console.log("Previous Clicked")

        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    })
    next.addEventListener("click", () => {
        console.log("Next Clicked")

        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    })

    //Add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log(e, e.target, e.target.value)
        currentSong.volume = parseInt(e.target.value) / 100;
    })

    // Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e => {
        console.log(e.target)
        if (e.target.src.includes("images/volume.svg")) {
            e.target.src = e.target.src.replace("images/volume.svg", "images/mute.svg")
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("images/mute.svg", "images/volume.svg")
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }

    })

}
main();