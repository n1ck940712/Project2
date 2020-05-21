    $(function(){
        var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

        // prompt for username if first time visit
        if (!localStorage.getItem("username")) {
            var username = prompt("Please enter your name:",  "username");
            localStorage.setItem("username",username);
        }
        var username = localStorage.getItem("username");

        $("#username").html(localStorage.getItem("username"));
        $("#message_submit").attr("disabled", true);
        let room ="General";
        joinRoom(room);

        // click send button when enter key is pressed
        $("#message_box").on("keyup", function(key) {
            if ($(this).val().length > 0) {
                $("#message_submit").attr("disabled", false);
                if (key.keyCode === 13) {
                    $("#message_submit").click();
                }
            } else {
                $("#message_submit").attr("disabled", true);
            }
        });

        // send message
        $("#message_submit").on("click", function() {
            $("#message_submit").attr("disabled", true);
            const message = $("#message_box").val();
            const time = new Date().toLocaleString();
            $("#message_box").val("");
            socket.send({"message":message, "username":username, "time":time, "room":room});
        });

        // add new room
        $("#add_new_room_submit").on("click", function(){
            var new_room_name = $("#add_new_room").val();
            new_room_name = new_room_name.charAt(0).toUpperCase() + new_room_name.slice(1);
            $("#add_new_room").val("");
            socket.emit("add_room", {"new_room_name":new_room_name});
        })

        // join room
        $("#room_list").on("click", function(e) {
            const target = e.target;
            if (target.matches("li")) {
                let newroom = target.innerHTML;
                if (newroom == room) {
                    message = `already in ${room} room.`
                    printSysMsg(message);
                } else {
                    leaveRoom(room);
                    joinRoom(newroom);
                    room=newroom;
                }
            }
        })


        // display message from users
        socket.on("message", data => {
            const p = document.createElement("p");
            const br = document.createElement("br");
            const username = document.createElement("span");
            const time = document.createElement("span");
            time.innerHTML = data.time;
            username.innerHTML = data.username;
            p.innerHTML = username.outerHTML + br.outerHTML + data.message + br.outerHTML + time.outerHTML;
            $("#chat_window").append(p);
        })

        // someone joined the room
        socket.on("joined", data => {
            if (data.username === localStorage.getItem("username")) {

                load_messages(data.history);
                console.log(data);
            }
            printSysMsg(data.message);
        })

        // someone left the room
        socket.on("left", data => {
            printSysMsg(data.message);
        })

        // load room when first connected
        socket.on("load_room", data => {
            loadRooms(data);
        })

        // new room added from users
        socket.on("new_room_added", data => {
        appendRoom(data["new_room_name"]);
        })


// functions-----------------------------------------
        function leaveRoom(room) {
            socket.emit("leave", {"username":username, "room":room});
        }

        function joinRoom(room) {
            $("#chat_window").html("");
            socket.emit("join", {"username":username, "room":room});
        }

        function printSysMsg(message) {
            const p = document.createElement("p");
            p.innerHTML = message;
            $("#chat_window").append(p);
        }

        function loadRooms(data) {
            for (room  in data["rooms"]) {
                appendRoom(room);
            }
        }

        function appendRoom(room) {
            const li = document.createElement("li");
            li.className = "list_item";
            li.setAttribute("id", room);
            li.innerHTML = room.charAt(0).toUpperCase() + room.slice(1);
            $("#room_list").append(li);
        }

        function load_messages(data) {
            for (i in data) {
                const p = document.createElement("p");
                p.innerHTML = data[i];
                $("#chat_window").append(p);
                document.getElementById("chat_window").innerHTML
            }
        }
    });
