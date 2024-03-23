import { Keyboard, StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { TabNavigationState } from '@react-navigation/native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../../types/RootStackParamList';
import { Ionicons, Fontisto, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthDispatchActions } from '../../hooks/useAuthDispatchActions';
import { useGlobalocketEvents } from '../../hooks/useGlobalSocketEvents';

interface TabBarInterface {
  state: TabNavigationState<MainTabParamList>;
  descriptors: any;
  navigation: any;
  insets: EdgeInsets;
}

const TabBar: FC<TabBarInterface> = ({ state, descriptors, navigation }) => {
  const {
    socket,
    defineBackgroundTask,
    onUpdateTaxisLocation,
    onRideRequest,
    onUpdateLocationToBeAvailable,
    onUserCancelRide,
    onTaxiConfirmedRide,
    onNoTaxisAvailable,
    onAllTaxisReject,
    onTaxiArrived,
    onRideCompleted,
  } = useGlobalocketEvents();
  const { roles } = useAuthDispatchActions();
  const [showTab, setShowTab] = useState<boolean>(true);

  const onKeyboardShow = () => setShowTab(false);
  const onKeyboardNotShow = () => setShowTab(true);

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener('keyboardDidShow', onKeyboardShow);
    const keyboardNotShowListener = Keyboard.addListener('keyboardDidHide', onKeyboardNotShow);
    
    navigation.addListener('beforeRemove', (e: any) => {
      if (e.data.action.type != 'POP_TO_TOP') e.preventDefault();
    });
    
    if (roles.find((role) => role.name === 'taxi'))
      defineBackgroundTask();

    return () => {
      keyboardShowListener.remove();
      keyboardNotShowListener.remove();
    };
  }, []);

  useMemo(() => {
    if (socket != undefined) {
      if (roles.find((role) => role.name === 'taxi')) {
        socket.on('update-taxi-location', onUpdateTaxisLocation);
        socket.on('ride-request', onRideRequest);
        socket.on('update-location-to-be-available', onUpdateLocationToBeAvailable);
        socket.on('user-cancel-ride', onUserCancelRide);
      }
      socket.on('taxi-confirmed-ride', onTaxiConfirmedRide);
      socket.on('no-taxis-available', onNoTaxisAvailable);
      socket.on('all-taxis-reject', onAllTaxisReject);
      socket.on('taxi-arrived', onTaxiArrived);
      socket.on('ride-completed', onRideCompleted);
    }
  }, [socket]);

  return (
    <>
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
