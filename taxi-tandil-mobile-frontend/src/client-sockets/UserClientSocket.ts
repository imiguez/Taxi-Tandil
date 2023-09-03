import { io } from "socket.io-client";

// Para android usar direccion ip

const socket = io(
    // 'http://localhost:3001'
    'http://192.168.0.187:3001'
);

export const connectedMsg = () => {
    socket.emit('connected_from_phone', 'Hola, un cliente se conecto.');
}