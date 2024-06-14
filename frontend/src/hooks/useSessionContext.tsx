import { createContext } from "react";

export const SessionContext = createContext<{
  setIsLogged: (logged: boolean | undefined) => void,
} | undefined>(undefined);