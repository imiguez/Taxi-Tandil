import { StyleSheet, View } from 'react-native'
import React from 'react'
import UserCancelNotification from '../../components/Taxi/UserCancelNotification';
import RideRequestBtn from '../../components/Taxi/RideRequestBtn';
import PermissionsPopUp from '../../components/Common/PermissionsPopUp';
import { AvailableBtn } from '../../components/Taxi/AvailableBtn';
import { useGlobalocketEvents } from '../../hooks/useGlobalSocketEvents';

const TaxiHome = () => {
    const {
        userCancel, setUserCancel, popUp, setPopUp,
        ride,
        onPressRideRequest,
    } = useGlobalocketEvents();

  return (
    <View style={styles.mainContainer}>
        {popUp && <PermissionsPopUp permissionType="background" close={() => setPopUp(false)} text="Para estar disponible se requiere tener la ubicación activada y otorgar el permiso: 'Permitir todo el tiempo'."/>}
        
        {ride && <RideRequestBtn onPress={onPressRideRequest}/>}

        {userCancel && <UserCancelNotification closeNotification={() => setUserCancel(false)}/>}
        
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