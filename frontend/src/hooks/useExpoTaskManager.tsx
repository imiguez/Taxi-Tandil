import * as TaskManager from "expo-task-manager";
import * as ExpoLocation from "expo-location";
import { useTaxiDispatchActions } from "./slices/useTaxiDispatchActions";
import { useRef } from "react";
import { BACKGROUND_LOCATION_TASK_NAME } from "constants/index";


export const useExpoTaskManager = () => {
  const sub = useRef<ExpoLocation.LocationSubscription>();
  const {setCurrentLocation} = useTaxiDispatchActions();

  const checkForegroundPermissions = async () => {
    try {
      const { granted } = await ExpoLocation.getForegroundPermissionsAsync();
      return granted;
    } catch (e) {
      console.log("checkForegroundPermissions " + e);
      return false;
    }
  };

  const checkBackgroundPermissions = async () => {
    try {
      const { granted } = await ExpoLocation.getBackgroundPermissionsAsync();
      return granted;
    } catch (e) {
      console.log("checkBackgroundPermissions " + e);
      return false;
    }
  };

  const requestForegroundPermissions = async () => {
    try {
      const fgPermissions = await ExpoLocation.requestForegroundPermissionsAsync();
      return fgPermissions;
    } catch (e) {
      console.log("requestForegroundPermissions " + e);
    }
  };

  const requestBackgroundPermissions = async () => {
    try {
      const bgPermissions = await ExpoLocation.requestBackgroundPermissionsAsync();
      return bgPermissions;
    } catch (e) {
      console.log("requestBackgroundPermissions " + e);
    }
  };

  const startForegroundUpdate = async () => {
    // Check if foreground permission is granted
    const granted = await checkForegroundPermissions();
    if (!granted) {
      console.log("startForegroundUpdate: location tracking denied");
      return false;
    }
    // Make sure that foreground location tracking is not running
    sub.current?.remove();

    // Start watching position in real-time
    ExpoLocation.watchPositionAsync(
      {
        // For better logs, we set the accuracy to the most sensitive option
        accuracy: ExpoLocation.Accuracy.BestForNavigation,
        distanceInterval: 50,
        // timeInterval: 10000,
      },
      (location) => {
        if (!location) return;
        console.log(`watchPositionAsync`);
        let locationLatLng = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(locationLatLng);
      }
    ).then((locationWatcher) => {
      sub.current = locationWatcher;
    }).catch((err) => {
      console.log(err)
    });
  };

  const stopForegroundUpdate = () => {
    if (sub.current)
      sub.current.remove();
    // console.log("Foreground location tracking stopped");
  };

  const startBackgroundUpdate = async () => {
    console.log("startBackgroundUpdate executed!");
    // Don't track position if permission is not granted
    const granted = await checkBackgroundPermissions();
    if (!granted) {
      console.log("startBackgroundUpdate: location tracking denied");
      return false;
    }

    // Make sure the task is defined otherwise do not start tracking
    const isTaskDefined = await TaskManager.isTaskDefined(
      BACKGROUND_LOCATION_TASK_NAME
    );
    if (!isTaskDefined) {
      console.log("Task wasn't defined");
      return false;
    }

    // Don't track if it is already running in background
    const hasStarted = await ExpoLocation.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK_NAME
    );
    if (hasStarted) {
      console.log("Task BACKGROUND_LOCATION_TASK_NAME already started");
      return true;
      // await stopBackgroundUpdate();
    }

    try {
      await ExpoLocation.startLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK_NAME,
        {
          accuracy: ExpoLocation.Accuracy.High,
          deferredUpdatesDistance: 50,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            killServiceOnDestroy: true,
            notificationTitle: "Ubicación",
            notificationBody: "Seguimiento de ubicación en segundo plano",
            notificationColor: "#fff",
          },
        }
      );
    } catch (e) {
      console.log(`startBackgroundUpdate: ${e}`);
      return false;
    }
    return true;
  };

  const stopBackgroundUpdate = async () => {
    // Make sure the task is defined otherwise do not start tracking
    const isTaskDefined = await TaskManager.isTaskDefined(
      BACKGROUND_LOCATION_TASK_NAME
    );
    if (!isTaskDefined) {
      console.log("Task wasn't defined");
      return false;
    }

    const hasStarted = await ExpoLocation.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK_NAME
    );
    if (hasStarted) {
      await ExpoLocation.stopLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK_NAME
      );
      console.log("Background location tracking stopped");
    }
  };

  const stopAllTaks = async () => {
    try {
      await TaskManager.unregisterAllTasksAsync();
    } catch (error) {
      console.log(error);
    }
  };

  return {
    checkForegroundPermissions, requestForegroundPermissions,
    checkBackgroundPermissions, requestBackgroundPermissions,
    startForegroundUpdate, stopForegroundUpdate,
    startBackgroundUpdate, stopBackgroundUpdate,
    stopAllTaks,
  };
};
