// Sets up the Three.js scene, camera, and renderer; builds the
// checkered board and pieces; handles selecting a piece, highlighting
// its legal moves (including captures), and moving it with the mouse;
// and keeps both players in sync over the Socket.IO `client` passed in
// (see Main.js), by sending/receiving move and capture events.
class Game {
    constructor(client) {
        this.current_move = "white";
        this.client = client
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 10000);
        this.camera.position.set(0, 100, 150)
        // Debug helper (disabled) - uncomment to draw the X/Y/Z axes
        // in the scene, handy for checking positions/orientation.
        // this.axes = new THREE.AxesHelper(1000)
        // this.scene.add(this.axes)
        this.camera.lookAt(this.scene.position)
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0x000000);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById("root").append(this.renderer.domElement);

        this.createArea()

        this.render()
    }

    setCamera = (col) => {
        switch (col) {
            case "white":
                this.camera.position.set(0, 100, 150)
                this.camera.lookAt(this.scene.position)
                break;
            case "black":
                this.camera.position.set(0, 100, -150)
                this.camera.lookAt(this.scene.position)
                this.camera.position.z = -170
                break;
            case "obserwator":
                this.camera.position.set(150, 100, 0)
                this.camera.lookAt(this.scene.position)
                this.camera.position.z = -10;
                break;
        }
        this.camera.position
    }

    areas = []

    // Builds the 8x8 board out of alternating white/black square
    // meshes, based on the checkerboard pattern below (1 = white
    // square, 0 = black square).
    createArea = () => {
        this.szachownica = [
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
        ]

        const geometry = new THREE.BoxGeometry(20, 5, 20);
        const white_area = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            wireframe: false,
            map: new THREE.TextureLoader().load('img/white_area.jpg')
        });

        const black_area = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            wireframe: false,
            map: new THREE.TextureLoader().load('img/black_area.png')
        });

        this.black_a = black_area

        for (let i = 0; i < this.szachownica.length; i++) {
            for (let j = 0; j < this.szachownica[i].length; j++) {
                switch (this.szachownica[i][j]) {
                    case 1:
                        this.cube = new THREE.Mesh(geometry, white_area);
                        this.cube.col = "c_white";
                        break;

                    case 0:
                        this.cube = new THREE.Mesh(geometry, black_area);
                        this.cube.col = "c_black";
                        break;
                    default:
                        break;
                }
                this.cube.pos = i + "," + j;
                this.cube.position.set(-70 + i * 20, 0, -80 + j * 20)
                this.scene.add(this.cube);
                this.areas.push(this.cube)
            }
        }
    }

    pions = [];
    pion_container = new THREE.Object3D();

    // (Re)builds the board and places pieces according to `tab` (the
    // starting layout passed in from Main.js: 0 = empty, 1 = white,
    // 2 = black). Also sets up the mousedown handler below that lets
    // the player select one of their own pieces, see its legal moves
    // highlighted, and click a highlighted square to move there.
    createPion = (tab) => {
        this.scene.clear();
        this.createArea();
        this.pionki = tab;

        const geometry = new THREE.CylinderGeometry(10, 10, 5, 32);
        const white_pion = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            wireframe: false,
            map: new THREE.TextureLoader().load('img/white_pion.jpg')
        });

        const black_pion = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            wireframe: false,
            map: new THREE.TextureLoader().load('img/black_pion.png')
        });

        const ch_pion = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            wireframe: false,
            map: new THREE.TextureLoader().load('img/chosen_pion.jpg')
        })

        const possible_area = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            wireframe: false,
            map: new THREE.TextureLoader().load('img/possible_area.png')
        });

        for (let i = 0; i < this.pionki.length; i++) {
            for (let j = 0; j < this.pionki[i].length; j++) {
                let create_new;
                switch (this.pionki[i][j]) {
                    case 1:
                        this.pion = new THREE.Mesh(geometry, white_pion);
                        this.pion.col = "p_white"
                        create_new = true;
                        break;
                    case 2:
                        this.pion = new THREE.Mesh(geometry, black_pion);
                        this.pion.col = "p_black"
                        create_new = true;
                        break;

                    case 0:
                        create_new = false;
                        break;
                }

                if (create_new) {
                    this.pion.pos = j + "," + i;
                    this.pion.position.set(-70 + j * 20, 5, -80 + i * 20)
                    this.pions.push(this.pion)
                    this.pion_container.add(this.pion)
                }
            }
        }

        this.scene.add(this.pion_container);

        // Used together to figure out which 3D object (if any) is under
        // the mouse: mouseVector holds the click position in normalized
        // device coordinates (-1 to 1 on each axis), and the raycaster
        // casts a ray from the camera through that point into the scene.
        const raycaster = new THREE.Raycaster();
        const mouseVector = new THREE.Vector2()

        let player_color = document.getElementById("p_color");
        let chosen_pion = "";
        let move_to;
        let last_pion = "";

        window.addEventListener("mousedown", (e) => {
            mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouseVector, this.camera);

            const intersects = raycaster.intersectObjects(this.scene.children);
            if (intersects.length > 0) {
                // Clicked one of OUR pieces: deselect whatever was
                // selected before, and - only if it's actually our turn -
                // select this one and work out where it's legal to move.
                if (intersects[0].object.col == "p_" + player_color.innerText) {
                    if (last_pion != "") {
                        switch (player_color.innerText) {
                            case "white":
                                last_pion.material = white_pion;
                                break;
                            case "black":
                                last_pion.material = black_pion;
                                break;
                        }
                    }

                    if (intersects[0].object.col == "p_" + this.current_move) {
                        chosen_pion = intersects[0].object;
                        console.log(chosen_pion.pos);
                        chosen_pion.material = ch_pion;
                        last_pion = chosen_pion;

                        for (let c = 0; c < this.areas.length; c++) {
                            if (this.areas[c].material == possible_area) {
                                this.areas[c].material = this.black_a
                            }
                        }
                        // found_x_minus/found_x_plus track whether a capture is
                        // available one square diagonally behind-left or
                        // behind-right of the selected piece (an opponent piece
                        // immediately next to it, with an empty square just past
                        // it to land on) - checked square by square below.
                        let found_x_minus = false;
                        let found_x_plus = false;

                        for (let c = 0; c < this.areas.length; c++) {
                            let a_pos_z = this.areas[c].position.z
                            let p_pos_z = chosen_pion.position.z
                            let a_pos_x = this.areas[c].position.x
                            let p_pos_x = chosen_pion.position.x

                            let found = false;

                            for (let p = 0; p < this.pions.length; p++) {
                                if (this.pions[p] != "zbity") {
                                    if (this.pions[p].position.x == a_pos_x && this.pions[p].position.z == a_pos_z) {
                                        found = true;
                                        switch (chosen_pion.col) {
                                            case "p_white":
                                                if (this.pions[p].col == "p_black" && this.pions[p].position.z == p_pos_z - 20 && (this.pions[p].position.x == p_pos_x - 20 || this.pions[p].position.x == p_pos_x + 20)) {
                                                    if (this.pions[p].position.x == p_pos_x - 20) {
                                                        found_x_minus = true;
                                                    }
                                                    else if (this.pions[p].position.x == p_pos_x + 20) {
                                                        found_x_plus = true;
                                                    }
                                                }
                                                break;
                                            case "p_black":
                                                if (this.pions[p].col == "p_white" && this.pions[p].position.z == p_pos_z + 20 && (this.pions[p].position.x == p_pos_x - 20 || this.pions[p].position.x == p_pos_x + 20)) {
                                                    if (this.pions[p].position.x == p_pos_x - 20) {
                                                        found_x_minus = true;
                                                    }
                                                    else if (this.pions[p].position.x == p_pos_x + 20) {
                                                        found_x_plus = true;
                                                    }
                                                }
                                                break;
                                        }
                                        if (found_x_minus && ((this.pions[p].position.z == p_pos_z - 40 && chosen_pion.col == "p_white") ||
                                            (this.pions[p].position.z == p_pos_z + 40 && chosen_pion.col == "p_black")) && this.pions[p].position.x == p_pos_x - 40) {
                                            found_x_minus = false
                                        }

                                        if (found_x_plus && ((this.pions[p].position.z == p_pos_z - 40 && chosen_pion.col == "p_white") ||
                                            (this.pions[p].position.z == p_pos_z + 40 && chosen_pion.col == "p_black")) && this.pions[p].position.x == p_pos_x + 40) {
                                            found_x_plus = false
                                        }
                                    }
                                }
                            }

                            // Highlight this square if it's a plain diagonal step
                            // forward into an empty cell, or - when a capture was
                            // found above - the (empty) landing square two cells
                            // past the jumped piece. "Forward" is -z for white,
                            // +z for black.
                            switch (chosen_pion.col) {
                                case "p_white":
                                    if (a_pos_z == p_pos_z - 20 && (a_pos_x == p_pos_x - 20 || a_pos_x == p_pos_x + 20) && !found) {
                                        this.areas[c].material = possible_area;
                                    }
                                    if (found_x_minus && a_pos_z == p_pos_z - 40 && a_pos_x == p_pos_x - 40) {
                                        this.areas[c].material = possible_area;
                                    }
                                    else if (found_x_plus && a_pos_z == p_pos_z - 40 && a_pos_x == p_pos_x + 40) {
                                        this.areas[c].material = possible_area;
                                    }
                                    break;
                                case "p_black":
                                    if (a_pos_z == p_pos_z + 20 && (a_pos_x == p_pos_x - 20 || a_pos_x == p_pos_x + 20) && !found) {
                                        this.areas[c].material = possible_area;
                                    }
                                    if (found_x_minus && a_pos_z == p_pos_z + 40 && a_pos_x == p_pos_x - 40) {
                                        this.areas[c].material = possible_area;
                                        console.log("aaa");
                                    }
                                    else if (found_x_plus && a_pos_z == p_pos_z + 40 && a_pos_x == p_pos_x + 40) {
                                        this.areas[c].material = possible_area;
                                        console.log("bbb");
                                    }
                                    break;
                            }

                        }
                    }
                }

                // Clicked a highlighted square while a piece is selected:
                // actually make the move.
                if (typeof (chosen_pion) != "undefined" && intersects[0].object.material == possible_area) {

                    let old_pos = chosen_pion.pos.split(",");
                    move_to = intersects[0].object;
                    chosen_pion.pos = move_to.pos
                    let new_pos = chosen_pion.pos.split(",");

                    // Moved two cells in each direction instead of one: that's a
                    // capture, so remove the opponent's piece sitting on the
                    // midpoint square (both locally and, via "zbicie", on the
                    // opponent's own board).
                    if ((old_pos[0] - new_pos[0]) % 2 == 0 && (old_pos[1] - new_pos[1]) % 2 == 0) {
                        let z_pion_pos = ((parseInt(old_pos[0]) + parseInt(new_pos[0])) / 2) + "," + ((parseInt(old_pos[1]) + parseInt(new_pos[1])) / 2);
                        let z_pion = this.pion_container.getObjectByProperty("pos", z_pion_pos);
                        this.pion_container.remove(z_pion);

                        let tab_pion = this.pions.filter(obj => {
                            if (obj.pos == z_pion_pos) {
                                this.pions[this.pions.indexOf(obj)] = "zbity";
                            }
                        })

                        console.log(this.pions);

                        this.client.emit("zbicie", {
                            pionek: z_pion_pos
                        })
                    }

                    tab[old_pos[1]][old_pos[0]] = 0;
                    switch (chosen_pion.col) {
                        case "p_white":
                            tab[new_pos[1]][new_pos[0]] = 1;
                            break;

                        case "p_black":
                            tab[new_pos[1]][new_pos[0]] = 2;
                            break;
                    }
                    // Slides the piece to its new square over 100ms, at a
                    // constant (linear) speed, without repeating. Once it
                    // arrives, onComplete below clears the move highlights,
                    // hands the turn to the opponent, starts our own waiting
                    // timer, and tells the server about the move so it can
                    // relay it to the opponent.
                    new TWEEN.Tween(chosen_pion.position)
                        .to({ x: move_to.position.x, z: move_to.position.z }, 100)
                        .repeat(0)
                        .easing(TWEEN.Easing.Linear.None)
                        .onUpdate(() => { })
                        .onComplete(() => {
                            for (let c = 0; c < this.areas.length; c++) {
                                if (this.areas[c].material == possible_area) {
                                    this.areas[c].material = this.black_a
                                }
                            }

                            switch (this.current_move) {
                                case "white":
                                    this.current_move = "black";
                                    break;
                                case "black":
                                    this.current_move = "white";
                                    break;
                            }
                            switch (player_color.innerText) {
                                case "white":
                                    chosen_pion.material = white_pion;
                                    break;
                                case "black":
                                    chosen_pion.material = black_pion;
                                    break;
                            }
                            chosen_pion = undefined;

                            console.log(this.current_move);

                            let wait_screen = document.getElementById("waiting_screen");
                            wait_screen.className = "dark";
                            startTimer();

                            this.client.emit("move", {
                                from: old_pos,
                                to: new_pos
                            })

                        })
                        .start()
                }

            }
        });
    }

    // Applies a move RECEIVED from the opponent (see the "set" handler
    // in Main.js): hands the turn back to this player and animates the
    // matching piece (found by its old position) sliding to its new one.
    move = (data) => {
        switch (this.current_move) {
            case "white":
                this.current_move = "black";
                break;
            case "black":
                this.current_move = "white";
                break;
        }
        for (let i = 0; i < this.pions.length; i++) {
            if (this.pions[i].pos == data.from[0] + "," + data.from[1]) {
                this.pions[i].pos = data.to[0] + "," + data.to[1];
                new TWEEN.Tween(this.pions[i].position)
                    .to({ x: -70 + data.to[0] * 20, z: -80 + data.to[1] * 20 }, 100)
                    .repeat(0)
                    .easing(TWEEN.Easing.Linear.None)
                    .onUpdate(() => { })
                    .onComplete(() => {
                    })
                    .start()
                break;
            }
        }
    }

    // Removes a piece that the OPPONENT just captured on their board
    // (see the "zbij" handler in Main.js), so both sides agree on
    // which pieces remain.
    zbij = (p_pos) => {
        let z_pion = this.pion_container.getObjectByProperty("pos", p_pos.pionek);
        this.pion_container.remove(z_pion);

        let tab_pion = this.pions.filter(obj => {
            if (obj.pos == p_pos.pionek) {
                this.pions[this.pions.indexOf(obj)] = "zbity";
            }
        })

        console.log(this.pions);
    }

    render = () => {
        requestAnimationFrame(this.render);
        this.renderer.render(this.scene, this.camera);
        if (typeof (TWEEN) != "undefined") {
            TWEEN.update();
        }
    }
}