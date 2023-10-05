import { Server } from "socket.io";
import { calculateDistances } from "./LocationsMeter.js";


const port = 3001;
console.log("Socket server started on port: "+port);

const io = new Server(port, { 
  cors: {origin: "192.168.0.187:8081"}
});

let activeRides = new Map();
let taxisLocation = new Map();
let taxisLocationLastUpdate = new Date();
const frequencyToCheckLastUpdate = 5;


const onJoinRoom = (room, id) => {
  console.log(`${id} has joined to the room: ${room}`);
  io.sockets.sockets.get(id).join(room);
}

const onLeaveRoom = (room, id) => {
  console.log(`${id} has left the room: ${room}`);
  io.sockets.sockets.get(id).leave(room);
}

const checkLastLocationUpdate = (userId) => {
  // console.log(`Update location executed? ${taxisLocationLastUpdate < new Date().setSeconds(-frequencyToCheckLastUpdate)}`);
  // if (taxisLocationLastUpdate < new Date().setSeconds(frequencyToCheckLastUpdate*-1)) {
  if (true) {
    taxisLocation = new Map();
    io.to("taxis-available").emit("update-taxis-location", userId);
  } else {
    resolveNewRideRequest(userId);
  }
}

const getNearestTaxi = (alreadyRequesteds, ride) => {
  let nearestTaxi = {
    id: null,
    distance: null,
  };

  taxisLocation.forEach((obj, id) => {
    if (obj.lastUpdate > new Date().setSeconds(-frequencyToCheckLastUpdate)){
      // CHECK IF THE TAXI IS BEING REQUESTED AT THIS MOMENT
      let isBeingRequested = io.sockets.sockets.get(id).rooms.has("being-requested");
      if (isBeingRequested) {
        console.log(`${id} is being requested.`);
      } else {
        // CHECK IF THE TAXI ALREADY WAS REQUESTED BY THIS RIDE
        let alreadyRequested = alreadyRequesteds.find(r => r == id);
        if (alreadyRequested) {
          console.log(`${id} has been requested.`);
        } else {
          let location = obj.location;
          let currentDistance = calculateDistances(ride.origin, location);
          if (nearestTaxi.distance == null || nearestTaxi.distance > currentDistance) {
            nearestTaxi ={
              id: id,
              distance: currentDistance,
            };
          }
        }
      }
    } else  {
      console.log(`Last update for ${id} was +${frequencyToCheckLastUpdate}s ago!`);
      // within the else it should be a re-call to update taxis location and search again the nearest
    }
  });

  return nearestTaxi;
}

const resolveNewRideRequest = (userId) => {
  if (activeRides.get(userId) == undefined) {
    console.log("activeRides.get("+userId+") is undefined.");
    return;
  }
  let nearestTaxi = getNearestTaxi(activeRides.get(userId).alreadyRequesteds, activeRides.get(userId).ride);
  if (nearestTaxi.id) {
    io.to(nearestTaxi.id).emit("ride-request", activeRides.get(userId).ride, userId); // Sends the user id
    onJoinRoom("being-requested", nearestTaxi.id);
    console.log("ride-request emitted to "+nearestTaxi.id+" !");
  } else {
    console.log("Error: nearestTaxi.id is null.");
  }
}


io.on("connection", (socket) => {
  socket.on("join-room", (room) => onJoinRoom(room, socket.id));
  socket.on("leave-room", (room) => onLeaveRoom(room, socket.id));

  socket.on("new-ride", (ride) => {
    console.log("new-ride received from: "+socket.id);
    activeRides.set(socket.id, {
      ride: ride,
      alreadyRequesteds: [],
    });
    checkLastLocationUpdate(socket.id);
  });
  
  socket.on("taxis-location-updated", (location, userId = null) => {
    console.log(`Location: ${location.latitude}, ${location.longitude}`);
    taxisLocation.set(socket.id, {
      location: location,
      lastUpdate: new Date(),
    });
    if (userId != null && taxisLocation.size == io.sockets.adapter.rooms.get("taxis-available").size) {
      taxisLocationLastUpdate = new Date();
      resolveNewRideRequest(userId);
    }
  });

  socket.on("ride-response", (accepted, userId) => {
    onLeaveRoom("being-requested", socket.id);
    if (accepted) {
      activeRides.delete(userId);
      io.to(userId).emit("taxi-confirmed-ride", taxisLocation.get(socket.id).location, socket.id);
      onLeaveRoom("taxis-available", socket.id);
      taxisLocation.delete(socket.id);
    } else {
      activeRides.get(userId).alreadyRequesteds.push(socket.id);
      console.log("searching new taxi, taxis availables: "+taxisLocation.size);
      checkLastLocationUpdate(userId);
    }
  });
});