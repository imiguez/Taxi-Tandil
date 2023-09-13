import { io } from "socket.io-client";

// Para android usar direccion ip

const socket = io(
    // 'http://localhost:3001'
    'http://192.168.0.187:3001'
);

export type Location = {
    lat: number,
    lon: number
};

export const getSocket = () => socket;

export const connectedMsg = (rol: string) => {
    socket.emit('connected_from_phone', `Hola, un ${rol} se conecto.`);
}

export const joinRoom = (room: string) => {
    socket.emit("join-room", room);
}

export const emitNewTrip = (location: Location) => {
    console.log("CLICKED EMIT NEW TRIP!");
    socket.emit("new-trip", location, socket.id);
}

export const onGetAllTaxisLocation = (triggerGetLocation: () => Location) => {
    socket.on("get-all-taxis-location", (userId: string) => {
        console.log("get-all-taxis-location received");
        let loc = triggerGetLocation();
        console.log("La ubicacion es: "+loc.lat+", "+loc.lon);
        emitSendTaxiLocation(loc, userId);
    });
}

export const emitSendTaxiLocation = (location: Location, userId: string) => {
    socket.emit("send-taxi-location", socket.id, location, userId);

}

export const onTripRequest = (setTripReq: (tripReq: any) => void) => {
    socket.on("trip-request", (userLocation: Location, userId: string) => {
        console.log("trip-request received");
        setTripReq({
            exists: true,
            userLocation: userLocation,
            userId: userId
        });
    });
}

export const emitTripResponse = (userId: string, accepted: boolean) => {
    console.log("Trip accepted");
    socket.emit("trip-response", userId, accepted);
}

export const onTaxiConfirmedTrip = (setNewTrip: (newTrip: any) => void) => {
    socket.on("taxi-confirmed-trip", (taxiId) => {
        console.log("Trip confirmed by taxi");
        setNewTrip({
            exists: true,
            taxiId: taxiId
        });
    })
}