import { StyleSheet, Text, View } from 'react-native';
import React, { useMemo, useState } from 'react';
import { NotificationsMap } from '@constants/index';
import { useCommonSlice } from '@hooks/slices/useCommonSlice';
import { useTaxiDispatchActions } from '@hooks/slices/useTaxiDispatchActions';
import { AcceptRideBtn } from './AcceptRideBtn';
import RideCard from '@components/Common/Cards/RideCard';
import RideCardBtnsContainer from '@components/Common/Cards/RideCardBtnsContainer';

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
    <RideCard>
      <View>
        <Text numberOfLines={1} style={styles.addressText}>
          {ride?.origin ? ride.origin.longStringLocation : 'Cargando direccion...'}
        </Text>
        <Text numberOfLines={1} style={styles.addressText}>
          {ride?.destination ? ride.destination.longStringLocation : 'Cargando direccion...'}
        </Text>
      </View>

      <Text>{userDisconnected ? NotificationsMap.get('User disconnected') : username ? `Viaje a pedido de: ${username}` : ''}</Text>

      <RideCardBtnsContainer>
        <AcceptRideBtn userDisconnected={userDisconnected} />
      </RideCardBtnsContainer>
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