import { Modal, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import React, { FC, ReactNode } from 'react'

interface WarningModalInterface {
    text: string,
    close: () => void,
    cardStyles?: StyleProp<ViewStyle>,
    children?: ReactNode,
}


const WarningModal: FC<WarningModalInterface> = ({text, close, cardStyles, children}) => {
  return (
    <Modal animationType='none' transparent onRequestClose={close}>
      <View style={[styles.cardContainer, cardStyles ? cardStyles : {}]}>
            <Text style={styles.text}>{text}</Text>
            {children}
            <View style={styles.btnsContainer}>
                <TouchableOpacity onPress={close}>
                    <Text>Ok</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
  )
}

export default WarningModal

const styles = StyleSheet.create({
    cardContainer: {
        width: '80%',
        position: 'absolute',
        top: '25%',
        left: '10%',
        backgroundColor: 'white',
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'space-around',
        borderColor: 'gray',
        borderStyle: 'solid',
        borderWidth: 1,
        padding: 10,
        paddingBottom: 50
    },
    text: {
        paddingHorizontal: 10,
        fontSize: 16,
        paddingTop: 10
    },
    btnsContainer: {
        maxHeight: 50,
        width: '90%',
        paddingRight: 10,
        position: 'absolute',
        bottom: 0,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingBottom: 20,
    },
})