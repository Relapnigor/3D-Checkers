// Entry point: creates the Game and Net instances, connects to the
// server over Socket.IO, and wires up the login screen plus the
// real-time move/capture/forfeit events that keep both players' boards
// in sync.
let game;
let net;
let ui;
const client = io();

let waiting_text = document.getElementById("waiting_text");
let counter = document.getElementById("counter");

let player_nick;

let timer;

// Starts (or restarts) the 30-second "waiting for opponent" countdown,
// shown while it's the OTHER player's turn. If it reaches zero before
// their move arrives, this player wins by forfeit and the server is
// told to relay that to the opponent (see the "end"/"finish" events
// below and the matching handler in server.js).
function startTimer() {
    counter.innerText = 30;
    let counter_time = 30;

    timer = setInterval(() => {
        counter_time--;
        counter.innerText = counter_time;
        if (counter_time == 0) {
            clearInterval(timer)
            waiting_text.innerText = "Przeciwnik nie wykonał ruchu w wyznaczonym czasie!!!"
            counter.innerText = "Wygrywasz!!!"
            client.emit("end", {
                name: player_nick
            })
        }
    }, 1000);
}

window.onload = () => {
    game = new Game(client);
    net = new Net();

    // Starting layout: 1 = white piece, 2 = black piece, 0 = empty.
    let default_pion = [
        [0, 2, 0, 2, 0, 2, 0, 2],
        [2, 0, 2, 0, 2, 0, 2, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0],
    ]

    // Confirms the Socket.IO connection is live and logs this client's id.
    client.on("onconnect", (data) => {
        console.log(data.clientId)
    })

    log_div = document.getElementById("log_div");
    name_input = document.getElementById("name_input");
    dark_div = document.getElementById("dark");
    status_div = document.getElementById("status");
    let waiting_screen = document.getElementById("waiting_screen");

    log_div.onclick = function () {
        if (name_input.value != "") {
            let user = {
                name: name_input.value
            }

            player_nick = name_input.value;

            net.fetchPost(user);
            net.fetchGet();
            net.getData();
            setTimeout(() => {
                let p_color = document.getElementById("p_color");

                game.setCamera(p_color.innerText)
                game.createPion(default_pion)
                // White always moves first, so if this player is black,
                // they start out waiting for white's opening move.
                if (p_color.innerText == "black") {
                    waiting_screen.className = "dark";
                    startTimer();
                }
            }, 100);
        }
        else {
            alert("Podaj nazwę gracza!!!")
        }
    }

    // The opponent just moved: stop our countdown, hide the waiting
    // screen (it's our turn now), and animate their move on our board.
    client.on("set", (data) => {
        clearInterval(timer)
        waiting_screen.classList.add("dark", "hidden");
        console.log(data);
        game.move(data)
    })

    // The opponent's timer ran out waiting for OUR move, so they win.
    client.on("finish", (data) => {
        waiting_text.innerText = "Nie wykonano ruchu w wyznaczonym czasie";
        counter.innerHTML = "Gracz&nbsp;<span style='color: red'>" + data.name + "</span>&nbsp;wygrywa!!!";
        waiting_screen.className = "dark";
    })

    // The opponent captured one of our pieces - remove it from our board too.
    client.on("zbij", (data) => {
        game.zbij(data)
    })
}