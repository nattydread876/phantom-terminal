# Phantom Terminal

> Dial into an abandoned BBS from 1993. Something answers.

A retro choose-your-own-adventure game presented as a haunted bulletin board system. Pure vanilla HTML/CSS/JS — no frameworks, no dependencies, no build step.

## Play Now

**[https://nattydread876.github.io/phantom-terminal/](https://nattydread876.github.io/phantom-terminal/)**

## About

You've found a phone number scrawled on a bathroom wall: **1-555-PHANTOM**. Against your better judgment, you dial in. The BBS on the other end was supposed to be dead since 1993 — but something is still running.

Navigate message boards, decode encrypted files, and make choices that determine whether you upload yourself into the system, disconnect forever, archive what you find, or attempt the impossible merge.

### Features

- **CRT monitor aesthetic** — Phosphor green text, scanlines, vignette, screen flicker, bezel frame
- **Typewriter text animation** — Characters appear one at a time with authentic terminal feel
- **Branching narrative** — 40+ story nodes across message boards, file archives, chat sessions, and hidden doors
- **5 endings** — THE UPLOAD, THE DISCONNECT, THE ARCHIVE, THE MERGE, THE LOOP
- **Inventory system** — 4 collectible items gate access to different paths
- **Web Audio API sound** — Typewriter ticks, ambient hum, stinger chords, static bursts
- **Save/load** — Progress saved to localStorage automatically
- **Keyboard shortcuts** — Press 1-9 to select choices, ESC for a secret

## How to Play

**Mouse:** Click on choices to navigate.

**Keyboard:** Press number keys (1-9) to select choices. Press ESC repeatedly for a hidden path.

**Tip:** Explore thoroughly. Some paths require items found in other areas. The hardest ending requires three specific items.

## Run Locally

No build step required. Serve the files with any static HTTP server:

```bash
# Clone
git clone https://github.com/nattydread876/phantom-terminal.git
cd phantom-terminal

# Serve (pick one)
python3 -m http.server 8080
# or
npx serve .
# or
php -S localhost:8080
```

Open `http://localhost:8080` in your browser.

## Project Structure

```
phantom-terminal/
├── index.html          # Single HTML page
├── css/
│   └── terminal.css    # CRT terminal styling
└── js/
    ├── engine.js       # Game engine — rendering, audio, saves
    └── story.js        # Story data — all 40+ nodes and narrative
```

## Tech Stack

- **HTML/CSS/JS** — Vanilla, zero dependencies
- **VT323** — Google Fonts monospace typeface
- **Web Audio API** — Synthesized sound effects (no audio files)
- **localStorage** — Save/load game state
- **GitHub Pages** — Hosting and deployment

## License

MIT

---

*The signal never dies.*
