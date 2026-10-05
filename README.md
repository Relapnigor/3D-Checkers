# 3D Checkers

*[🇵🇱 Polska wersja README](README.pl.md)*

A real-time multiplayer checkers game rendered in 3D with Three.js, with a small Node/Express backend that pairs up two players and lets any number of spectators watch.

## Features

- 3D board and pieces rendered with Three.js, pieces moved by clicking a piece and then the destination square
- Legal moves (including captures) for the selected piece are highlighted on the board before you move
- Captures: jumping over an adjacent opponent piece removes it, for both players, in real time
- Real-time sync over Socket.IO - your opponent's moves and captures appear on your board the instant they make them, no refreshing or polling
- A 30-second per-turn countdown while waiting for the opponent; if they run out of time, you win by forfeit
- Smooth move animation (via @tweenjs/tween.js)
- Two players per match (white and black), assigned automatically as the first two people to log in
- Any number of spectators can join after that and watch from a side view
- A simple name-based login screen; the match starts once both players are present and the second player confirms ready

## Tech stack

- **Backend:** Node.js, [Express](https://expressjs.com/), [Socket.IO](https://socket.io/) for real-time move/capture/forfeit relaying between the two players
- **Frontend:** vanilla JavaScript, [Three.js](https://threejs.org/) for 3D rendering, [@tweenjs/tween.js](https://github.com/tweenjs/tween.js) for move animation, Socket.IO client (loaded from a CDN) - no framework, no build step
- Plain HTML/CSS

## Project structure

```
.
├── server.js                  # Express server: assigns player/spectator seats, signals game start
├── package.json
└── static/
    ├── index.html                # page shell, loads the scripts below
    ├── css/
    │   └── style.css               # styling for the login overlay
    ├── img/                          # piece and square textures
    ├── js/
    │   ├── Main.js                     # entry point: creates Game/Net, wires up login + Socket.IO move/capture/forfeit events
    │   ├── Ui.js                        # builds the login overlay's DOM
    │   ├── Net.js                        # talks to the server over plain HTTP: registers the player, polls for game start
    │   └── Game.js                        # the 3D scene: board, pieces, camera, legal-move highlighting, captures, move animation
    ├── libs/
    │   └── tween.umd.js                    # vendored copy of @tweenjs/tween.js - untouched, not part of this project's own code
    └── three/
        └── three145.js                       # vendored copy of three.js (r145) - untouched, not part of this project's own code
```

## Running locally

```bash
npm install
npm start
```

Then open `http://localhost:3000` in two browser tabs (or two different browsers/devices on the same network) to play as both sides, and open it in further tabs to spectate.

## How to play

1. Enter a name and click to log in. The first person becomes white, the second becomes black.
2. Once a third person (even just a spectator) has connected, the second player's screen lets them confirm the match is ready to start.
3. On your turn, click one of your own pieces - its legal moves light up on the board - then click one of the highlighted squares to move there (landing two squares away captures the piece in between).
4. While it's the opponent's turn, a 30-second countdown is shown; if they don't move in time, you win automatically.

## Notes

- Code comments are in English; a couple of user-facing strings (alerts, the server's startup log line) are still in Polish, since only comments were translated, not UI text.
- `static/libs/tween.umd.js` and `static/three/three145.js` are third-party libraries checked into the repo rather than installed as proper dependencies - they're listed above for completeness, but weren't modified or documented as part of this pass, since they aren't this project's own code.
