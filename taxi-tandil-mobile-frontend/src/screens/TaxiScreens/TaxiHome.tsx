import { StyleSheet, View } from 'react-native'
import React from 'react'
import RideRequestBtn from '../../components/Taxi/RideRequestBtn';
import PermissionsPopUp from '../../components/Common/PermissionsPopUp';
import { AvailableBtn } from '../../components/Taxi/AvailableBtn';
import { useGlobalocketEvents } from '../../hooks/useGlobalSocketEvents';
import { useCommonSlice } from '../../hooks/slices/useCommonSlice';
import RideCancelledNotification from '../../components/Common/Notifications/RideCancelledNotification';
import { NotificationsMap } from '../../constants';

const TaxiHome = () => {
    const {
        popUp, setPopUp,
        ride,
        onPressRideRequest,
    } = useGlobalocketEvents();
    const { notifications, removeNotification } = useCommonSlice();

  return (
    <View style={styles.mainContainer}>
        {popUp && <PermissionsPopUp permissionType="background" close={() => setPopUp(false)} text="Para estar disponible se requiere tener la ubicación activada y otorgar el permiso: 'Permitir todo el tiempo'."/>}
        
        {ride && <RideRequestBtn onPress={onPressRideRequest}/>}

        {notifications != undefined && notifications.find(n => n == 'User cancelled ride') != undefined &&
            <RideCancelledNotification text={NotificationsMap.get('User cancelled ride') ?? ''} onClose={() => removeNotification('User cancelled ride')}/>
        }

        <AvailableBtn setShowPopUp={setPopUp} />

    </View>
  )
}

export default TaxiHome

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        display: 'flex',
        backgroundColor: 'white',
        padding: 0,
    },
})