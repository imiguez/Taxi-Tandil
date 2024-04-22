import { StyleSheet, Text, TouchableHighlight, View } from 'react-native'
import React, { FC } from 'react'
import { Entypo } from '@expo/vector-icons';

interface RideCancelledNotificationInterface {
    text: string,
    onClose: () => void,
}

const RideCancelledNotification: FC<RideCancelledNotificationInterface> = ({ text, onClose }) => {
  return (
    <View style={[styles.notificationContainer]}>
        <Text style={styles.text}>{text}</Text>
        <TouchableHighlight style={styles.closeBtn} onPress={onClose}>
            <Entypo name="cross" size={24} color="black" />
        </TouchableHighlight>
    </View>
  )
}

export default RideCancelledNotification;

const styles = StyleSheet.create({
    notificationContainer: {
        width: '70%',
        position: 'absolute',
        left: '15%',
        bottom: '50%',
        justifyContent: 'space-between',
        backgroundColor: '#f9595980',
        borderRadius: 5,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: 'black',
        display: 'flex',
        flexDirection: 'row',
    },
    text: {
        paddingHorizontal: 10,
        paddingVertical: 20,
        width: '80%',
        textAlign: 'center'
    },
    closeBtn: {
        width: '20%',
        justifyContent: 'center',
        alignItems: 'center',
    }
})