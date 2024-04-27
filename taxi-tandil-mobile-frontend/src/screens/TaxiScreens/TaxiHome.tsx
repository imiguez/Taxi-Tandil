import { StyleSheet, View } from 'react-native'
import React from 'react'
import { NotificationsMap } from 'constants/index';
import BasicNotification from 'components/Common/Notifications/BasicNotification';
import PermissionsPopUp from 'components/Common/PermissionsPopUp';
import { AvailableBtn } from 'components/Taxi/Home/AvailableBtn';
import RideRequestBtn from 'components/Taxi/Home/RideRequestBtn';
import { useCommonSlice } from 'hooks/slices/useCommonSlice';
import { useGlobalocketEvents } from 'hooks/useGlobalSocketEvents';

const TaxiHome = () => {
    const {
        popUp, setPopUp, socket,
        ride,
        onPressRideRequest,
    } = useGlobalocketEvents();
    const { notifications, removeNotification } = useCommonSlice();

  return (
    <View style={styles.mainContainer}>
        {popUp && <PermissionsPopUp permissionType="background" close={() => setPopUp(false)} text="Para estar disponible se requiere tener la ubicación activada y otorgar el permiso: 'Permitir todo el tiempo'."/>}
        
        {ride && socket != undefined && <RideRequestBtn onPress={onPressRideRequest}/>}

        {notifications !== undefined &&
            notifications.map((notification, key) => {
                if (notification == 'User cancelled ride')
                    return <BasicNotification key={key} text={NotificationsMap.get('User cancelled ride') ?? ''} onClose={() => removeNotification('User cancelled ride')} additionalStyles={{backgroundColor: '#ff6b6b'}}/>
                if (notification == 'Taxi connection failed')
                    return <BasicNotification key={key} text={NotificationsMap.get('Taxi connection failed') ?? ''} onClose={() => removeNotification('Taxi connection failed')} additionalStyles={{backgroundColor: '#ff6b6b'}}/>;
            })
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