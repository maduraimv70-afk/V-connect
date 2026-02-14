const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("offer", data => socket.broadcast.emit("offer", data));
    socket.on("answer", data => socket.broadcast.emit("answer", data));
    socket.on("candidate", data => socket.broadcast.emit("candidate", data));

    socket.on("location", data => socket.broadcast.emit("location", data));

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

http.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
