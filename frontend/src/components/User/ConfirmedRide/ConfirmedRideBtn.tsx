import React, { FC, useContext } from 'react';
import { useCommonSlice } from '@hooks/slices/useCommonSlice';
import { useMapDispatchActions } from '@hooks/slices/useMapDispatchActions';
import { SocketContext } from '@hooks/useSocketContext';
import { StyleSheet, Text, TouchableHighlight } from 'react-native';

interface ConfirmedRideBtnInterface {
  taxiDisconnected: boolean;
}

const ConfirmedRideBtn: FC<ConfirmedRideBtnInterface> = ({ taxiDisconnected }) => {
  const { socket } = useContext(SocketContext)!;
  const { setRideStatus, rideStatus, setTaxiInfo } = useMapDispatchActions();
  const { removeNotification } = useCommonSlice();

  const onCancel = () => {
    socket!.emit('user-cancel-ride');
    setRideStatus(null);
    setTaxiInfo(null);
  };

  const onCancelRideBecauseTaxiDisconnect = () => {
    socket!.emit('cancel-ride-because-taxi-disconnect');
    setRideStatus(null);
    setTaxiInfo(null);
    removeNotification('Taxi disconnected');
  };

  return (
    <>
      {rideStatus && (rideStatus == 'all-taxis-reject' || rideStatus == 'no-taxis-available') && 
        <TouchableHighlight style={[styles.btn]} onPress={() => setRideStatus(null)} >
          <Text style={[styles.btnText]}>Volver atras</Text>
        </TouchableHighlight>
      }

      {(rideStatus == 'emitted' || rideStatus == 'accepted' || taxiDisconnected) && 
        <TouchableHighlight style={[styles.btn, {backgroundColor: '#f95959'}]} onPress={taxiDisconnected ? onCancelRideBecauseTaxiDisconnect : onCancel} >
          <Text style={[styles.btnText]}>Cancelar viaje</Text>
        </TouchableHighlight>
      }
    </>
  );
};

export default ConfirmedRideBtn;


const styles = StyleSheet.create({
  btn: {
    width: '100%',
    height: 60,
    minWidth: '40%',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  btnText: {
    fontSize: 22,
    fontWeight: '700',
  },
});