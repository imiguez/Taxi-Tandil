import { StyleProp, StyleSheet, Text, TouchableHighlight, ViewStyle } from 'react-native'
import React, { FC } from 'react'

interface RideCardBtnInterface {
    onClick: () => void,
    text: string,
    btnStyles?: StyleProp<ViewStyle>
}

const RideCardBtn: FC<RideCardBtnInterface> = ({ onClick, text, btnStyles }) => {
  return (
    <TouchableHighlight style={[rideCardBtnStyles.btn, btnStyles ?? {}]} onPress={onClick} >
        <Text style={rideCardBtnStyles.btnText}>{text}</Text>
    </TouchableHighlight>
  )
}

export default RideCardBtn

const rideCardBtnStyles = StyleSheet.create({
    btn: {
        height: 60,
        minWidth: '40%',
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 5,
        elevation: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnText: {
        fontSize: 16,
        fontWeight: '600',
    },
});