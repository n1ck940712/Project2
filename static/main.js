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
        let room = "room1";
        joinRoom("room1");

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
            socket.send({"message":message, "username":username, "time":time});
        });

        // add new room
        // document.getElementById("add_new_room_submit").onclick = () => {
        //     const new_room_name = add_new_room.value;
        //     document.getElementById("add_new_room").value = "";
        //     socket.emit("new_room", {"new_room_name": new_room_name});
        // }

        // join room
        $("#room_list").on("click", function(e) {
            const target = e.target;
            if (target.matches("p")) {
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

        // display message
        socket.on("message", data => {
            const p = document.createElement("p");
            const br = document.createElement("br");
            const span_username = document.createElement("span");
            const span_timestamp = document.createElement("span");

            if(data.username) {
                span_timestamp.innerHTML = data.time;
                span_username.innerHTML = data.username;
                p.innerHTML = span_username.outerHTML + br.outerHTML + data.message + br.outerHTML + span_timestamp.outerHTML;
            } else {
                printSysMsg(data.message);
            }
            $("#chat_window").append(p);
        })

        // new room added
        // socket.on("new_room_added", data => {
        //     const p = document.createElement("p");
        //     p.className = "room_select";
        //     p.innerHTML = data.new_room_name;
        //     document.getElementById("room_list").append(p);
        // })


// functions-----------------------------------------
        function leaveRoom(room) {
            socket.emit("leave", {"username":username, "room":room});
            console.log("left");
        }

        function joinRoom(room) {
            socket.emit("join", {"username":username, "room":room});
            $("#chat_window").html("");
            console.log("joined");
        }

        function printSysMsg(message) {
            const p = document.createElement("p");
            p.innerHTML = message;
            $("#chat_window").append(p);
        }

    });
