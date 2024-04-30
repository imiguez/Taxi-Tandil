import { AppState, AppStateStatus, Keyboard, StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { TabNavigationState } from '@react-navigation/native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { Ionicons, Fontisto, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import WarningModal from './WarningModal';
import { useAuthDispatchActions } from 'hooks/slices/useAuthDispatchActions';
import { useCommonSlice } from 'hooks/slices/useCommonSlice';
import { useMapDispatchActions } from 'hooks/slices/useMapDispatchActions';
import { useTaxiDispatchActions } from 'hooks/slices/useTaxiDispatchActions';
import { useGlobalocketEvents } from 'hooks/useGlobalSocketEvents';
import { useSocketConnectionEvents } from 'hooks/useSocketConnectionEvents';
import { MainTabParamList } from 'types/RootStackParamList';

interface TabBarInterface {
  state: TabNavigationState<MainTabParamList>;
  descriptors: any;
  navigation: any;
  insets: EdgeInsets;
}

const TabBar: FC<TabBarInterface> = ({ state, descriptors, navigation }) => {
  const {
    socket, onReconnect,
    defineBackgroundTask,
    onUpdateTaxisLocation,
    onRideRequest,
    onUserDisconnect,
    onUserCancelRide, 
    onTaxiCancelRide,
    onTaxiConfirmedRide,
    onTaxiUpdateLocation,
    onNoTaxisAvailable,
    onAllTaxisReject,
    onTaxiArrived,
    onRideCompleted
  } = useGlobalocketEvents();
  const { roles } = useAuthDispatchActions();
  const {origin, destination, rideStatus, taxi} = useMapDispatchActions();
  const {ride, userId, username, available} = useTaxiDispatchActions();
  const taxiRideStatus = useTaxiDispatchActions().rideStatus;
  const {reconnectionCheck} = useSocketConnectionEvents();
  const [showTab, setShowTab] = useState<boolean>(true);
  const { error, errorMessage, cleanError } = useCommonSlice();

  const onKeyboardShow = () => setShowTab(false);
  const onKeyboardNotShow = () => setShowTab(true);
  
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState !== 'active') {
      if (socket != undefined) { // If its currently on a ride request or active ride.
        if (socket.auth.role == 'user') {
          await SecureStore.setItemAsync('origin', JSON.stringify(origin));
          await SecureStore.setItemAsync('destination', JSON.stringify(destination));
          await SecureStore.setItemAsync('rideStatus', JSON.stringify(rideStatus));
          await SecureStore.setItemAsync('taxi', JSON.stringify(taxi));
        } else if (socket.auth.role == 'taxi') {
          await SecureStore.setItemAsync('ride', JSON.stringify(ride));
          await SecureStore.setItemAsync('userId', JSON.stringify(userId));
          await SecureStore.setItemAsync('username', JSON.stringify(username));
          await SecureStore.setItemAsync('available', JSON.stringify(available));
          await SecureStore.setItemAsync('taxiRideStatus', JSON.stringify(taxiRideStatus));
        }
      }
    }
    AppState.currentState = nextAppState;
  }

  useEffect(() => {
    reconnectionCheck();

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    const keyboardShowListener = Keyboard.addListener('keyboardDidShow', onKeyboardShow);
    const keyboardNotShowListener = Keyboard.addListener('keyboardDidHide', onKeyboardNotShow);
    
    navigation.addListener('beforeRemove', (e: any) => {
      if (e.data.action.type != 'POP_TO_TOP') e.preventDefault();
    });
    
    if (roles.find((role) => role.name === 'taxi'))
      defineBackgroundTask();
    
    return () => {
      subscription.remove();
      keyboardShowListener.remove();
      keyboardNotShowListener.remove();
      navigation.removeListener('beforeRemove', (e: any) => {
        if (e.data.action.type != 'POP_TO_TOP') e.preventDefault();
      });
    };
  }, []);

  useMemo(() => {
    if (socket != undefined) {
      if (roles.find((role) => role.name === 'taxi')) {
        socket.on('update-taxi-location', onUpdateTaxisLocation);
        socket.on('ride-request', onRideRequest);
        socket.on('user-cancel-ride', onUserCancelRide);
        socket.on('user-disconnect', onUserDisconnect);
      }
      socket.on('no-taxis-available', onNoTaxisAvailable);
      socket.on('all-taxis-reject', onAllTaxisReject);
      socket.on('taxi-confirmed-ride', onTaxiConfirmedRide);
      socket.on('location-update-from-taxi', onTaxiUpdateLocation);
      socket.on('taxi-cancelled-ride', onTaxiCancelRide);
      socket.on('taxi-arrived', onTaxiArrived);
      socket.on('ride-completed', onRideCompleted);

      socket.on('reconnect-after-reconnection-check', onReconnect);
    }
  }, [socket]);

  return (
    <>
      {error && errorMessage != undefined &&
        <WarningModal close={cleanError} text={errorMessage} />
      }

      <LinearGradient
        style={[styles.linearGradient, !showTab ? { display: 'none' } : {}]}
        locations={[0.2, 1]}
        colors={['transparent', '#0000001b']}
      />
      <View style={[styles.tabBar, !showTab ? { display: 'none' } : {}]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          if (route.name == 'Taxi' && !roles.find((role) => role.name === 'taxi'))
            return;

          return (
            <View style={styles.container} key={index}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.btn}
                key={index}
              >
                {route.name == 'Taxi' && <MaterialIcons name="local-taxi" size={30} color={isFocused ? 'black' : '#a8a7a7'} />}
                {route.name == 'Rides' &&
                  (isFocused ? <Ionicons name="map" size={24} color="black" /> : <Fontisto name="map" size={24} color="black" />)}
                {route.name == 'Home' && <Ionicons name={isFocused ? 'car' : 'car-outline'} size={30} color="black" />}
                {route.name == 'Settings' && <Ionicons name={isFocused ? 'settings-sharp' : 'settings-outline'} size={30} color="black" />}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </>
  );
};

export default TabBar;

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    width: '100%',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderTopWidth: 1,
    borderColor: '#d8d7d7',
  },
  container: {
    width: 60,
    height: 70,
  },
  btn: {
    bottom: 5,
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linearGradient: {
    width: '100%',
    height: 10,
    position: 'absolute',
    bottom: 70,
  },
});
