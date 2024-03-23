import { Modal, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import React, { FC, ReactNode } from 'react'

interface AreYouSureModalInterface {
    text: string,
    onAccept: () => void,
    close: () => void,
    cardStyles?: StyleProp<ViewStyle>,
    children?: ReactNode,
}

const AreYouSureModal: FC<AreYouSureModalInterface> = ({text, onAccept, close, cardStyles, children}) => {
  return (
    <Modal animationType='none' transparent onRequestClose={close}>
        <View style={[styles.cardContainer, cardStyles ? cardStyles : {}]}>
            <Text style={styles.text}>{text}</Text>
            {children}
            <View style={styles.btnsContainer}>
                <TouchableOpacity onPress={close}>
                    <Text>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onAccept}>
                    <Text>Aceptar</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
  )
}

export default AreYouSureModal

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
        position: 'absolute',
        bottom: 0,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
})