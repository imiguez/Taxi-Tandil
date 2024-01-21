import { StyleSheet, Text, TouchableHighlight, View } from 'react-native'
import React, { FC } from 'react'

type UserCancelNotificationProps = {
    closeNotification: () => void,
}
/**
 * @todo Change the X letter from the button to an actual cross icon.
 */
const UserCancelNotification: FC<UserCancelNotificationProps> = ({closeNotification}) => {
  return (
    <View style={[styles.notificationContainer, styles.userCancelContainer]}>
        <Text style={styles.text}>El usuario cancelo el viaje.</Text>
        <TouchableHighlight style={styles.closeBtn} onPress={closeNotification}>
            <Text style={{fontSize: 30, textAlign: 'center', color: 'black'}}>X</Text>
        </TouchableHighlight>
    </View>
  )
}

export default UserCancelNotification

const styles = StyleSheet.create({
    notificationContainer: {
        width: '70%',
        position: 'absolute',
        left: '15%',
        bottom: '20%',
    },
    userCancelContainer: {
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
        justifyContent: 'center'
    }
});