import * as TaskManager from "expo-task-manager";
import * as ExpoLocation from "expo-location";
import constants from "../constants";

export const useExpoTaskManager = () => {
  let foregroundSubscription: ExpoLocation.LocationSubscription | null = null;
  let userId: string | null = null;

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
      },
      (location) => {
        console.log(`watchPositionAsync: ${location.coords}`);
      }
    );
  };

  const stopForegroundUpdate = () => {
    foregroundSubscription?.remove();
  };

  const startBackgroundUpdate = async (id: string) => {
    userId = id;
    console.log("startBackgroundUpdate executed!");
    // Don't track position if permission is not granted
    const granted = await checkBackgroundPermissions();
    if (!granted) {
      console.log("startBackgroundUpdate: location tracking denied");
      return false;
    }

    // Make sure the task is defined otherwise do not start tracking
    const isTaskDefined = await TaskManager.isTaskDefined(
      constants.BACKGROUND_LOCATION_TASK_NAME
    );
    if (!isTaskDefined) {
      console.log("Tasks werent defined");
      return false;
    }

    // Don't track if it is already running in background
    const hasStarted = await ExpoLocation.hasStartedLocationUpdatesAsync(
      constants.BACKGROUND_LOCATION_TASK_NAME
    );
    if (hasStarted) {
      console.log("Task BACKGROUND_LOCATION_TASK_NAME already started");
      return true;
      // await stopBackgroundUpdate();
    }

    try {
      await ExpoLocation.startLocationUpdatesAsync(
        constants.BACKGROUND_LOCATION_TASK_NAME,
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
      constants.BACKGROUND_LOCATION_TASK_NAME
    );
    if (hasStarted) {
      await ExpoLocation.stopLocationUpdatesAsync(
        constants.BACKGROUND_LOCATION_TASK_NAME
      );
      console.log("Location tracking stopped");
    }
  };

  // Start location tracking in background
  const startLocationCheck = async () => {
    console.log("startLocationCheck executed!");
    const isTaskDefined = await TaskManager.isTaskDefined(
      constants.CHECK_LOCATION_ACTIVE
    );
    if (!isTaskDefined) {
      console.log("Tasks werent defined");
      return false;
    }

    // Don't track if it is already running in background
    const hasStarted = await ExpoLocation.hasStartedLocationUpdatesAsync(
      constants.CHECK_LOCATION_ACTIVE
    );
    if (hasStarted) {
      console.log("Task CHECK_LOCATION_ACTIVE already started");
      return true;
    }

    try {
      await ExpoLocation.startLocationUpdatesAsync(
        constants.CHECK_LOCATION_ACTIVE,
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
    checkForegroundPermissions,
    checkBackgroundPermissions,
    startForegroundUpdate,
    stopForegroundUpdate,
    startBackgroundUpdate,
    stopBackgroundUpdate,
    startLocationCheck,
    stopAllTaks,
  };
};
