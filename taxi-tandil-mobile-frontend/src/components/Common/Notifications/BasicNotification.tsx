import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import React, { FC } from 'react';
import { Entypo } from '@expo/vector-icons';

interface BasicNotificationInterface {
    text: string,
    onClose: () => void,
    additionalStyles?: ViewStyle,
}

const BasicNotification: FC<BasicNotificationInterface> = ({ text, onClose, additionalStyles }) => {
    let borderColor = 'black';
    if (additionalStyles && additionalStyles.backgroundColor != undefined)
        borderColor = 'white';

    return (
        <View style={[styles.notificationContainer, additionalStyles ?? {}]}>
            <Text style={styles.text}>{text}</Text>
            <View style={styles.btnContainer}>
                <View style={{minHeight: 50, width: 2, backgroundColor: borderColor}}></View>
                <TouchableOpacity style={[styles.closeBtn]} onPress={onClose}>
                    <Entypo name="cross" size={24} color="black" />
                </TouchableOpacity>
            </View>

        </View>
    )
}

export default BasicNotification;

const styles = StyleSheet.create({
    notificationContainer: {
        width: '70%',
        position: 'absolute',
        left: '15%',
        bottom: '50%',
        justifyContent: 'space-between',
        backgroundColor: 'white',
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
    btnContainer: {
        paddingVertical: 10,
        height: '100%', 
        width: '20%', 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center',
    },
    bar: {

    },
    closeBtn: {
        width: '90%',
        minHeight: 50,
        justifyContent: 'center',
        alignItems: 'center',
    }
});