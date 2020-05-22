    $(function(){
        var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

        // prompt for username if first time visit
        if (!localStorage.getItem("username")) {
            var username = prompt("Please enter your name:",  "username");
            username = username.charAt(0).toUpperCase() + username.slice(1);
            localStorage.setItem("username",username);
        }

        // initialization
        var username = localStorage.getItem("username");
        $("#username").html("Logged in as " + username);
        $("#message_submit").attr("disabled", true);

        // check for active room
        if (!localStorage.getItem("activeRoom")) {
            var room = "General";
            joinRoom(room);
        } else {
            var room = localStorage.getItem("activeRoom");
            joinRoom(room);
        }

        // enter key triggers click message send button
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

        // click on send button to send message
        $("#message_submit").on("click", function() {
            $("#message_submit").attr("disabled", true);
            const message = $("#message_box").val();
            const time = new Date().toLocaleString();
            $("#message_box").val("");
            socket.send({"message":message, "username":username, "time":time, "room":room});
        });

        // click on add room button to add new room
        $("#add_new_room_submit").on("click", function(){
            const message = document.createElement("h4");
            message.innerHTML = "Enter name for new room";
            $("#pop_up_message").html(message);
            $("#popUpWindow").show();
            $("#pop_up_addroom").show();
        })
        $("#pop_up_input").on("keyup", function(key) {
            if ($(this).val().length>0) {
                if (key.keyCode === 13) {
                    let roomName = $(this).val();
                    roomName = roomName.charAt(0).toUpperCase()+roomName.slice(1);
                    $("#popUpWindow").hide();
                    socket.emit("add_room", {"new_room_name":roomName, "username":localStorage.getItem("username")});
                }
            }
        })
        // click on room name to join room
        $("#room_list").on("click", function(e) {
            const target = e.target;
            if (target.matches("li")) {
                let newroom = target.innerHTML;
                room = localStorage.getItem("activeRoom");
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

        // click other users message to private chat
        $("#chat_window").on("click", function(e) {
            const target = e.target;
            if (target.matches("p")) {
                let username = target.children[0].innerHTML;
                $("#private_chat_button").html(`Message ${username}`);
                $("#popUpWindow").show();
                $("#pop_up_privatechat").show();

            }
        })
        $(".closeButton").on("click", function() {
            $("#popUpWindow").hide();
            $("#pop_up_addroom").hide();
            $("#pop_up_privatechat").hide();

        })

        // display message from users
        socket.on("message", data => {
            const p = document.createElement("p");
            const br = document.createElement("br");
            const username = document.createElement("span");
            const time = document.createElement("span");
            time.innerHTML = data.time;
            username.innerHTML = data.username;
            time.className = "messageTime";
            username.className = "messageUsername";
            p.innerHTML = username.outerHTML + br.outerHTML + data.message + br.outerHTML + time.outerHTML;
            if (data["username"] === localStorage.getItem("username")) {
                p.className = "messageFloatRight";
            } else {
                p.className = "messageFloatLeft";
            }
            $("#chat_window").append(p);
            $(".chat_window_container").scrollTop(500000);
        })

        // someone joined the room
        socket.on("joined", data => {
            if (data.username === localStorage.getItem("username")) {
                load_messages(data.history);
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
            if (data.error === "") {
                appendRoom(data["new_room_name"]);
            } else {
                if (data.username === localStorage.getItem("username")) {
                    alert(data.error);
                }
            }
        })


// functions-----------------------------------------
        function leaveRoom(room) {
            socket.emit("leave", {"username":username, "room":room});
            $("#"+room).removeClass("active");
        }

        function joinRoom(room) {
            localStorage.setItem("activeRoom", room);
            socket.emit("join", {"username":username, "room":room});
            $("#"+room).addClass("active");
        }

        function printSysMsg(message) {
            const p = document.createElement("p");
            p.innerHTML = message;
            p.className = "sysMessage";
            $("#chat_window").append(p);
            $(".chat_window_container").scrollTop(500000);
        }

        function loadRooms(data) {
            for (i  in data["rooms"]) {
                appendRoom(i);
            }
            let room = localStorage.getItem("activeRoom");

            $("#"+room).addClass("active");
        }

        function appendRoom(room) {
            const li = document.createElement("li");
            li.className = "list-group-item";
            li.setAttribute("id", room);
            li.innerHTML = room.charAt(0).toUpperCase() + room.slice(1);
            $("#room_list").append(li);
        }

        function load_messages(data) {
            $("#chat_window").html("");
            for (i in data) {
                const p = document.createElement("p");
                const mes = document.createElement("p");
                const br = document.createElement("br");
                const username = document.createElement("span");
                const time = document.createElement("span");
                time.innerHTML = data[i]["time"];
                time.className = "messageTime";
                username.innerHTML = data[i]["username"];
                username.className = "messageUsername";
                p.innerHTML = username.outerHTML + br.outerHTML + data[i]["message"] + br.outerHTML + time.outerHTML;
                if (data[i]["username"] === localStorage.getItem("username")) {
                    p.className = "messageFloatRight";
                } else {
                    p.className = "messageFloatLeft";
                }

                $("#chat_window").append(p);
            }
            $(".chat_window_container").scrollTop(500000);
        }
    });
