import * as TaskManager from "expo-task-manager";
import * as ExpoLocation from "expo-location";
import { BACKGROUND_LOCATION_TASK_NAME, CHECK_LOCATION_ACTIVE } from "../constants";
import { useTaxiDispatchActions } from "./useTaxiDispatchActions";


export const useExpoTaskManager = () => {
  let foregroundSubscription: ExpoLocation.LocationSubscription | null = null;
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
    foregroundSubscription?.remove();

    // Start watching position in real-time
    foregroundSubscription = await ExpoLocation.watchPositionAsync(
      {
        // For better logs, we set the accuracy to the most sensitive option
        accuracy: ExpoLocation.Accuracy.BestForNavigation,
        distanceInterval: 100,
        // timeInterval: 4000,
      },
      (location) => {
        console.log(`watchPositionAsync`);
        let locationLatLng = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(locationLatLng);
      }
    );
  };

  const stopForegroundUpdate = () => {
    foregroundSubscription?.remove();
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
      console.log("Tasks werent defined");
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
          accuracy: ExpoLocation.Accuracy.BestForNavigation,
          deferredUpdatesInterval: 10000,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: "Location",
            notificationBody: "Location tracking in background",
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
    const hasStarted = await ExpoLocation.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK_NAME
    );
    if (hasStarted) {
      await ExpoLocation.stopLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK_NAME
      );
      console.log("Location tracking stopped");
    }
  };

  // Start location tracking in background
  const startLocationCheck = async () => {
    console.log("startLocationCheck executed!");
    const isTaskDefined = await TaskManager.isTaskDefined(
      CHECK_LOCATION_ACTIVE
    );
    if (!isTaskDefined) {
      console.log("Tasks werent defined");
      return false;
    }

    // Don't track if it is already running in background
    const hasStarted = await ExpoLocation.hasStartedLocationUpdatesAsync(
      CHECK_LOCATION_ACTIVE
    );
    if (hasStarted) {
      console.log(`Task ${CHECK_LOCATION_ACTIVE} already started`);
      await ExpoLocation.stopLocationUpdatesAsync(CHECK_LOCATION_ACTIVE);
    }

    try {
      await ExpoLocation.startLocationUpdatesAsync(
        CHECK_LOCATION_ACTIVE,
        {
          accuracy: ExpoLocation.Accuracy.Balanced,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: "Location",
            notificationBody: "Location tracking in background",
            notificationColor: "#fff",
          },
        }
      );
    } catch (e) {
      console.log(`startLocationCheck: ${e}`);
      return false;
    }
    return true;
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
    startLocationCheck,
    stopAllTaks,
  };
};
