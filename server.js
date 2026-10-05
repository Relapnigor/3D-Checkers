const express = require("express")
const app = express()
const PORT = 3000;

app.use(express.static('static'))
const path = require("path");
const { send } = require("process");
app.use(express.json());

const http = require('http');

const server = http.createServer(app);

const { Server } = require("socket.io");
const socketio = new Server(server);

// Real-time layer (on top of the plain HTTP routes below): relays each
// player's moves and captures straight to their opponent, instead of
// making them wait for the opponent to poll for updates.
socketio.on('connection', (client) => {
    console.log("klient się podłączył z id = ", client.id)

    client.emit("onconnect", {
        clientId: client.id
    })

    client.on("disconnect", (reason) => {
        console.log("klient się rozłącza", reason)
    })

    // Relays a move (from/to board coordinates) to the other player.
    client.on("move", (data) => {
        console.log(data);
        client.broadcast.emit("set", data)
    })

    // Relays a forfeit: the sender's turn-timer (see Main.js) ran out
    // waiting for the OTHER player to move, so the sender wins.
    client.on("end", (data) => {
        console.log(data);
        client.broadcast.emit("finish", data)
    })

    // Relays a capture (which square's piece was taken) to the other
    // player, so it disappears from their board too.
    client.on("zbicie", (data) => {
        console.log(data);
        client.broadcast.emit("zbij", data)
    })
});

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "/static/index.html"))
})

// The first two people to connect become the two players (white and
// black); everyone after that is registered as a spectator.
let users = {
    user1: {
        name: "",
        color: "white"
    },
    user2: {
        name: "",
        color: "black"
    },
    spectator: {
        spectate: false
    }
}

let users_number = 1;

let send_obj;

// Assigns whoever just connected a seat: player 1 (white), player 2
// (black, as long as their name differs from player 1's), or a
// spectator once both player seats are taken.
app.post("/add_user", function (req, res) {
    if (users_number == 1) {
        users.user1.name = req.body.name;
        users_number++;
        send_obj = users.user1;
    }
    else if (users_number == 2) {
        if (req.body.name != users.user1.name) {
            users.user2.name = req.body.name;
            users_number++;
            send_obj = users.user2;
        }
        else {
            send_obj = {
                message: "Aktualna nazwa użytkownika jest już zajęta!!!"
            }
        }
    }
    else {
        users.spectator.spectate = true
        send_obj = users.spectator;
    }
})

app.get("/add_user", function (req, res) {
    res.setHeader('content-type', 'application/json'); // response header: tells the client this is JSON
    res.end(JSON.stringify(send_obj));
})

let start_ready = {
    user: "",
    color: "",
    ready: false
}

// Player 2 signals they're ready once a third person (at least one
// spectator) has connected - see Ui.js/Net.js for how this is polled.
app.post("/start", function (req, res) {
    if (users_number > 2) {
        start_ready.ready = true;
        start_ready.user = users.user2.name;
        start_ready.color = users.user2.color;
    }
})

app.get("/start", function (req, res) {
    res.setHeader('content-type', 'application/json'); // response header: tells the client this is JSON
    res.end(JSON.stringify(start_ready));
})

server.listen(3000, () => {
    console.log('server listening on 3000');
});