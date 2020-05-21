import os
from time import localtime, strftime
from flask import Flask, render_template, url_for, g, request, redirect, session
from flask_socketio import SocketIO, send, emit, join_room, leave_room


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

rooms = ["room1", "room2", "room3", "room4"]
# channels["Main"]=[]
# userlist={}

@app.route("/")
def index():
    print("test")
    return render_template("index.html", rooms=rooms)

@socketio.on("message")
def message(data):
    send({"message": data["message"], "username":data["username"], "time":data["time"]})


@socketio.on("join")
def on_join(data):
    username = data["username"]
    room = data["room"]
    join_room(room)
    send({"message": username + " has join the " + room + " room."}, room=room)

@socketio.on("leave")
def on_leave(data):
    username = data["username"]
    room = data["room"]
    leave_room(room)
    send({"message": username + " has left the " + room + " room."}, room=room)

@socketio.on("new_room")
def new_room(data):
    new_room_name = data["new_room_name"]
    rooms.append(data["new_room_name"])
    emit("new_room_added", {"new_room_name":new_room_name}, room=room)

if __name__ == "__main__":
    socketio.run(app)
