// Builds the login overlay shown before the game starts: a status
// message, a name field, and "Log in" / "Reset" buttons. The actual
// login click handler lives in Main.js, since it needs the Game and Net
// instances created there.
let screen_div = document.getElementById("screen");
let dark_div = document.getElementById("dark")
let status_div = document.createElement("div");
status_div.id = "status";
status_div.className = "status";
status_div.innerText = "STATUS";

let logging_div = document.createElement("div");
logging_div.id = "login";
logging_div.className = "log";

let title_div = document.createElement("div");
title_div.innerText = "Logowanie";
title_div.className = "log_text";

let name_input = document.createElement("input");
name_input.type = "text";
name_input.className = "name";
name_input.id = "name_input";

let name_div = document.createElement("div");
name_div.className = "name_div";
name_div.appendChild(name_input);

let log_div = document.createElement("div");
log_div.innerText = "Loguj";
log_div.className = "l_button";
log_div.id = "log_div"

let reset_div = document.createElement("div");
reset_div.innerText = "Reset";
reset_div.className = "l_button";

logging_div.appendChild(title_div);
logging_div.appendChild(name_div);
logging_div.appendChild(log_div);
logging_div.appendChild(reset_div);

screen_div.appendChild(status_div);
screen_div.appendChild(logging_div);

reset_div.onclick = function () {
    name_input.value = "";
}

