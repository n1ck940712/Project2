    $(function(){
        var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

        socket.on("connect", function() {
            // username
            if (!localStorage.getItem("username")) {
                window.usernameGlobal = prompt("Please enter your name:",  "username");
                usernameGlobal = usernameGlobal.charAt(0).toUpperCase() + usernameGlobal.slice(1);
                localStorage.setItem("username",usernameGlobal);
            } else {
                window.usernameGlobal = localStorage.getItem("username");
            }
            $("#username").html("Logged in as " + usernameGlobal); //insert username to heading
            $("#message_submit").attr("disabled", true); //diable message submit button at start

            socket.emit("userConnected", {"username":usernameGlobal})

            // check for active room
            if (!localStorage.getItem("activeRoom")) {
                window.room = "General";
                joinRoom(room);
            } else {
                window.room = localStorage.getItem("activeRoom");
                joinRoom(room);
            }

            socket.emit("loadroom");
        })

        // send message
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
            socket.send({"message":message, "username":usernameGlobal, "time":time, "room":room});
        });
        // display message from users
        socket.on("message", data => {
            const p = document.createElement("p");
            const br = document.createElement("br");
            const messageUsername = document.createElement("span");
            const time = document.createElement("span");
            time.innerHTML = data.time;
            messageUsername.innerHTML = data.username;
            time.className = "messageTime";
            messageUsername.className = "messageUsername";
            p.innerHTML = messageUsername.outerHTML + br.outerHTML + data.message + br.outerHTML + time.outerHTML;
            if (data["username"] === usernameGlobal) {
                p.className = "messageFloatRight";
            } else {
                p.className = "messageFloatLeft";
            }
            $("#chat_window").append(p);
            $(".chat_window_container").scrollTop(500000);
        })

        // add new room
        $("#add_new_room_submit").on("click", function(){
            $("#popUpWindow").show();
            $("#pop_up_addroom").show();
            $("#pop_up_input").focus();
        })
        $("#pop_up_input").on("keyup", function(key) {
            if ($(this).val().length>0) {
                if (key.keyCode === 13) {
                    let roomName = $(this).val();
                    roomName = roomName.charAt(0).toUpperCase()+roomName.slice(1);
                    $("#popUpWindow").hide();
                    $("#pop_up_addroom").hide();
                    $("#pop_up_input").val("");
                    socket.emit("add_room", {"new_room_name":roomName, "username":usernameGlobal});
                }
            }
        })
        // new room added from users
        socket.on("new_room_added", data => {
            if (data.error === "") {
                appendRoom(data["new_room_name"]);
            } else {
                if (data.username === usernameGlobal) {
                    alert(data.error);
                }
            }
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
        // someone joined the room
        socket.on("joined", data => {
            localStorage.setItem("activeRoom", data.room);
            if (data.username === usernameGlobal) {
                load_messages(data.history);
            }
            printSysMsg(data.message);
        })
        // someone left the room
        socket.on("left", data => {
            printSysMsg(data.message);
        })

        // private message
        $("#chat_window").on("click", function(e) {
            const target = e.target;
            if (target.matches("p")) {
                let receiver = target.children[0].innerHTML;
                $("#private_chat_button").html(`Message ${receiver}`);
                $("#popUpWindow").show();
                $("#pop_up_privatechat").show();
            }
        })
        //modal close button
        $(".closeButton").on("click", function() {
            $("#popUpWindow").hide();
            $("#pop_up_addroom").hide();
            $("#pop_up_privatechat").hide();

        })

        // load room when first connected
        socket.on("load_room", data => {
            loadRooms(data);
        })

// functions==============================================================================
// functions==============================================================================

        function leaveRoom(room) {
            $("#"+room).removeClass("active");
            socket.emit("leave", {"username":usernameGlobal, "room":room});
        }

        function joinRoom(room) {
            $("#"+room).addClass("active");
            socket.emit("join", {"username":usernameGlobal, "room":room});
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
                const messageUsername = document.createElement("span");
                const time = document.createElement("span");
                time.innerHTML = data[i]["time"];
                time.className = "messageTime";
                messageUsername.innerHTML = data[i]["username"];
                messageUsername.className = "messageUsername";
                p.innerHTML = messageUsername.outerHTML + br.outerHTML + data[i]["message"] + br.outerHTML + time.outerHTML;
                if (data[i]["username"] === usernameGlobal) {
                    p.className = "messageFloatRight";
                } else {
                    p.className = "messageFloatLeft";
                }

                $("#chat_window").append(p);
            }
            $(".chat_window_container").scrollTop(500000);
        }
    });
