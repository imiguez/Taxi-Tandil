//@ts-nocheck
import { createContext } from "react";
import { Socket, io } from "socket.io-client";
import * as TaskManager from "expo-task-manager";
import constants from "../constants";
import * as ExpoLocation from 'expo-location';


let id = null;

export const idSetter = (newId: string) => {
  id = newId;
  console.log(`userId change to: ${id}`);
}

const socket = io('http://192.168.0.187:3001');

TaskManager.defineTask(constants.CHECK_LOCATION_ACTIVE, async ({ data, error }) => {
    try {
        if (error) new Error(error);
        const { locations } = data;
        const location = locations[0];
        if (location) {
            socket.emit('check-taxi-has-location-activated');
            console.log("taxi-has-location-activated send");
        }
        await ExpoLocation.stopLocationUpdatesAsync(constants.CHECK_LOCATION_ACTIVE);
        console.log(`Task ${constants.CHECK_LOCATION_ACTIVE} stopped.`);
    } catch (error) {
      console.error(`TaskManager: ${error}`);
    }
});

TaskManager.defineTask(constants.BACKGROUND_LOCATION_TASK_NAME, async ({ data, error }) => {
    try {
        if (error) new Error(error);
        const { locations } = data;
        const {latitude, longitude} = locations[0].coords;
        const location = {
          latitude: latitude,
          longitude: longitude,
        };
        if (location) {
          if (id != null) {
            console.log('location-update-for-user to: '+id);
            socket.emit('location-update-for-user', location, id);
          }
        }
    } catch (error) {
      console.error(`TaskManager: ${error}`);
    }
});

export const SocketContext = createContext<Socket>(socket);