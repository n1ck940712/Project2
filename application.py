import os
from time import localtime, strftime
from flask import Flask, render_template, url_for, g, request, redirect, session
from flask_socketio import SocketIO, send, emit, join_room, leave_room

import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)



app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

rooms = {}
rooms["General"]=[]
limit = 100
# userlist={}

@app.route("/")
def index():
    return render_template("index.html", rooms=rooms)

@socketio.on("connect")
def connect():
    emit("load_room", {"rooms": rooms})

@socketio.on("message")
def message(data):
    room = data["room"]
    rooms[room].append(data["message"])
    if (len(rooms[room])>limit):
        rooms[room].pop(0)
    send({"message": data["message"], "username":data["username"], "time":data["time"]}, room=room)


@socketio.on("join")
def on_join(data):
    username = data["username"]
    room = data["room"]
    join_room(room)
    emit("joined", {"message": username + " has join the " + room + " room.", "username":username, "history":rooms[room]}, room=room)

@socketio.on("leave")
def on_leave(data):
    username = data["username"]
    room = data["room"]
    leave_room(room)
    emit("left", {"message": username + " has left the " + room + " room."}, room=room)

@socketio.on("add_room")
def new_room(data):
    new_room_name = data["new_room_name"]
    rooms[new_room_name]=[]
    emit("new_room_added", {"new_room_name":new_room_name}, broadcast=True)

if __name__ == "__main__":
    socketio.run(app)
