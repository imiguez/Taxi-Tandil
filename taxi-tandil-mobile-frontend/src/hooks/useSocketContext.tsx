import { createContext } from "react";
import { Socket, io } from "socket.io-client";

// Para android usar direccion ip
export const SocketContext = createContext<Socket>(io('http://192.168.0.187:3001'));