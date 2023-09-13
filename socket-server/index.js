import { Server } from "socket.io";
import { calculateDistances } from "./LocationsMeter.js";


const port = 3001;
console.log("Socket server started on port: "+port);

const io = new Server(port, { 
  cors: {origin: "192.168.0.187:8081"}
});

// Podria usarse para no pedir la ubicacion de los taxis si se actualizo hace poco (4s aprox).
let taxisAvailableLocation = {
  lastUpdate: undefined,
  taxis: []
}
let newTrips = new Map();
let taxisAvailableCount = 0;

const onJoinRoom = (room, id) => {
  console.log(`${id} has joined to the room: ${room}`);
  io.sockets.sockets.get(id).join(room);
  if (room == "taxis-available")
    taxisAvailableCount++;
  if (room == "taxis-requested")
    taxisAvailableCount--;
}

const onLeaveRoom = (room, id) => {
  console.log(`${id} has left the room: ${room}`);
  io.sockets.sockets.get(id).leave(room);
  if (room == "taxis-available")
    taxisAvailableCount--;
  if (room == "taxis-requested")
    taxisAvailableCount++;
}

io.on("connection", (socket) => {
  
  socket.on('connected_from_phone', (msg) => {
    console.log(msg);
  });

  socket.on("join-room", (room) => onJoinRoom(room, socket.id));

  socket.on("leave-room", (room) => onLeaveRoom(room, socket.id));

  socket.on("new-trip", (userLocation, userId) => {
    console.log("new-trip received");
    newTrips.set(userId, {
      userLocation: userLocation,
      taxis: new Map(),
    });
    io.volatile.to("taxis-available").emit("get-all-taxis-location", userId);
  });
  
  socket.on("send-taxi-location", (taxiId, taxiLocation, userId) => {
    console.log("send-taxi-location received");
    console.log(taxiId+" location is: "+taxiLocation.lat+", "+taxiLocation.lon);
    newTrips.get(userId).taxis.set(taxiId, taxiLocation);
    if (newTrips.get(userId).taxis.size >= taxisAvailableCount){
      console.log("Entro al if con taxisAvailableCount con un valor de: "+taxisAvailableCount
      +"y el arreglo tiene un tamaño de: "+newTrips.get(userId).taxis.size);
      let nearestTaxi;
      let toConsole;
      newTrips.get(userId).taxis.forEach((location, taxiId) => {
        let taxiRooms = io.sockets.sockets.get(taxiId).rooms;
        const distance = calculateDistances(newTrips.get(userId).userLocation, location);
        if(nearestTaxi == undefined ||
            (taxiRooms.has("taxis-available") && !taxiRooms.has("taxis-requested")
            && distance < nearestTaxi.distance)) {
          nearestTaxi = {
            distance: distance,
            id: taxiId
          }
          toConsole = location;
        }
      });
      onJoinRoom("taxis-requested", nearestTaxi.id);
      console.log(toConsole);
      io.to(nearestTaxi.id).emit("trip-request", newTrips.get(userId).userLocation, userId);
      console.log("Sending trip-request to: "+nearestTaxi.id);
    }
  });

  socket.on("trip-response", (userId, response) => {
    if (response) {
      newTrips.delete(userId);
      onLeaveRoom("taxis-available", socket.id);
      socket.to(userId).emit("taxi-confirmed-trip", socket.id);
    }
    // FALTA EL ELSE
    
    onLeaveRoom("taxis-requested", socket.id);
  });

});