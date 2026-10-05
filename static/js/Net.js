// Handles all communication with the Express server: registering the
// player, and polling for the game-start signal once both players are
// connected.
class Net {
    server_response;

    constructor() {

    }

    // Registers the player (sends their chosen name) with the server's
    // /add_user endpoint.
    fetchPost(obj) {

        const body = JSON.stringify(obj)

        const headers = { "Content-Type": "application/json" }

        fetch("/add_user", { method: "post", body, headers })
            .then(response => response.json())
            .then(
                data => console.log(data)
            )
    }


    fetchGet() {
        const headers = { "Content-Type": "application/json" }

        fetch("/add_user", { method: "get", headers })
            .then(response => response.text())
            .then(
                data => console.log(data)
            )
    }

    // Reads back the server's reply to fetchPost() (which player seat -
    // or spectator slot - was assigned) and updates the login screen
    // accordingly. If this player took the second seat, it also starts
    // polling /start every second until the server reports both players
    // are present, then hides the login overlay.
    async getData() {
        let resp = await fetch("/add_user");
        let info = await resp.text()
        let dane = JSON.parse(info)

        status_div.style.fontSize = "20px";

        if (typeof (dane.message) == "undefined") {
            if (typeof (dane.spectate) == "undefined") {
                status_div.innerHTML = "User added<br>Witaj <span id='player_name' style='color: red'>" + dane.name + "</span>. Twój kolor to <span id='p_color' style='color:" + dane.color + "'>" + dane.color + "</span>";
            }
            else {
                status_div.innerHTML = "Lista graczy jest pełna. Jesteś <span id='p_color'>obserwator</span>em"
            }
            logging_div.style.display = "none";
            let waiting_div = document.createElement("div");
            waiting_div.innerHTML = "Oczekiwanie na<br>drugiego gracza";
            waiting_div.className = "wait";

            let loading_div = document.createElement("div");
            loading_div.className = "wait"
            let l_n = 0;
            let loading = setInterval(() => {
                loading_div.innerText += ".";
                l_n++;
                if (l_n == 4) {
                    l_n = 0;
                    loading_div.innerText = "";
                }

            }, 250);

            if (typeof (dane.spectate) == "undefined") {
                const body = JSON.stringify({ user: "ready" })

                const headers = { "Content-Type": "application/json" }

                fetch("/start", { method: "post", body, headers })
                    .then(response => response.json())
                    .then(
                        data => console.log(data)
                    )
                let start_wait = setInterval(() => {
                    fetch("/start", { method: "get", headers })
                        .then(response => response.text())
                        .then(
                            start => {
                                console.log(start);
                                start = JSON.parse(start);
                                console.log(start);
                                if (start.ready) {
                                    clearInterval(start_wait)
                                    clearInterval(loading)
                                    dark_div.style.display = "none";
                                    let p_name = document.getElementById("player_name").innerText;
                                    if (p_name != start.user) {
                                        status_div.innerHTML += "<br>Połączył się gracz <span style='color: red;'>" + start.user + "</span>. Gra jako kolor <span style='color: " + start.color + "'>" + start.color + "</span>"
                                    }
                                }
                            }
                        )
                }, 1000);
            }
            else {
                dark_div.style.display = "none";
            }
            dark_div.appendChild(waiting_div);
            dark_div.appendChild(loading_div)
        }
        else {
            alert(dane.message)
        }

    }
}



