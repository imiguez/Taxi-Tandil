import { ExpoConfig } from 'expo/config';

export default (): ExpoConfig => ({
  name: "Ride",
  slug: "Ride",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./public/assets/icon.png",
  splash: {
    image: "./public/assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffcf00"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  experiments: {
    tsconfigPaths: true
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.imiguez.ride",
    infoPlist: {
      UIBackgroundModes: [
        "location",
      ]
    },
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
    }
  },
  android: {
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_LOCATION",
      "android.permission.INTERNET",
      "android.permission.POST_NOTIFICATIONS",
    ],
    adaptiveIcon: {
      foregroundImage: "./public/assets/adaptive-icon.png",
      backgroundColor: "#ffcf00"
    },
    package: "com.imiguez.ride",
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    }
  },
  plugins: [
    "expo-secure-store",
    [
      "onesignal-expo-plugin",
      {
        mode: !!process.env.DEVELOPMENT_ENV ? "development" : "production",
        smallIconAccentColor: "#ffcf00",
      }
    ],
    [
      "expo-location",
      {
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true
      }
    ],
    [
      "expo-build-properties",
      {
        android: {
          __comment: "Setting usesCleartextTraffic to true is for Http (not Https) request on prod apks builds.",
          usesCleartextTraffic: false 
        }
      }
    ]
  ],
  extra: {
    eas: {
      projectId: "5d7d5ef3-2c17-41ef-a3f6-490b8d2c4b41",
      oneSignalAppId: process.env.EXPO_PUBLIC_ONE_SIGNAL_APP_ID
    }
  },
  updates: {
    url: "https://u.expo.dev/5d7d5ef3-2c17-41ef-a3f6-490b8d2c4b41"
  },
  runtimeVersion: {
    policy: "appVersion"
  }
});
