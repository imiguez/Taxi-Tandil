import { createContext } from "react";
import { Socket } from "socket.io-client";

export const SocketContext = createContext<{
  socket: Socket | undefined,
  setSocket: (socket: Socket | undefined) => void,
} | undefined>(undefined);