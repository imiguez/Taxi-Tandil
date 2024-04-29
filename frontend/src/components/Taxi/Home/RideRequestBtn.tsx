import { StyleSheet, Text, TouchableHighlight, View } from 'react-native'
import React, { FC } from 'react'

type RideRequestBtnProps = {
    onPress: () => Promise<void>,
}

const RideRequestBtn: FC<RideRequestBtnProps> = ({onPress}) => {
  return (
    <View style={styles.container}>
        <TouchableHighlight style={styles.newRideBtn} onPress={onPress}>
            <Text>Viaje solicitado</Text>
        </TouchableHighlight>
    </View>
  )
}

export default RideRequestBtn

const styles = StyleSheet.create({
    container: {
        width: '70%',
        position: 'absolute',
        left: '15%',
        bottom: '20%',
        zIndex: 1,
    },
    newRideBtn: {
        alignItems: 'center',
        backgroundColor: '#8ded8e',
        borderRadius: 5,
        paddingVertical: 22,
    },
});