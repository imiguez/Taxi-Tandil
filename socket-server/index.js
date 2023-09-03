import { Server } from "socket.io";

const port = 3001;

console.log("Socket server started on port: "+port);
const io = new Server(port, { 
    cors: {
        // origin: "*"
        origin: "192.168.0.187:8081"
    }
 });

io.on("connection", (socket) => {
  socket.on('connected_from_phone', (msg) => {
    console.log(msg);
  });
});