import { StyleSheet, Text, View } from 'react-native';
import React, { useMemo, useState } from 'react';
import { NotificationsMap, windowHeight } from '@constants/index';
import { useCommonSlice } from '@hooks/slices/useCommonSlice';
import { useTaxiDispatchActions } from '@hooks/slices/useTaxiDispatchActions';
import { AcceptRideBtn } from './AcceptRideBtn';
import RideCard from '@components/Common/Cards/RideCard';

const AcceptedRideCard = () => {
  const { ride, username } = useTaxiDispatchActions();
  const { notifications } = useCommonSlice();
  const [userDisconnected, setUserDisconnected] = useState<boolean>(false);

  useMemo(() => {
    let showCancelBtnBecauseUserDisconnect = false;
    notifications.forEach((notification) => {
      if (notification === 'User disconnected') showCancelBtnBecauseUserDisconnect = true;
    });
    setUserDisconnected(showCancelBtnBecauseUserDisconnect);
  }, [notifications]);

  return (
    <RideCard maxYTranslation={-windowHeight+100} minYTranslation={-140} initialPosition={-windowHeight/1.5}>
      <View>
        <Text numberOfLines={1} style={styles.addressText}>
          {ride?.origin ? ride.origin.longAddress : 'Cargando direccion...'}
        </Text>
        <Text numberOfLines={1} style={styles.addressText}>
          {ride?.destination ? ride.destination.longAddress : 'Cargando direccion...'}
        </Text>
      </View>

      <Text>{userDisconnected ? NotificationsMap.get('User disconnected') : (username ? `Viaje a pedido de: ${username}` : '')}</Text>

      <AcceptRideBtn userDisconnected={userDisconnected} />
    </RideCard>
  );
};

export default AcceptedRideCard;

const styles = StyleSheet.create({
  addressText: {
    backgroundColor: '#d1d1d18f',
    borderWidth: 1,
    borderColor: '#d1d1d1a8',
    borderStyle: 'solid',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 16,
    marginBottom: 10,
  },
});