import { StyleSheet, Text, TouchableHighlight, View } from 'react-native'
import React, { FC } from 'react'

type PermissionsBtnProps = {
    onPress: () => void,
    text: string
}

const PermissionsBtn: FC<PermissionsBtnProps> = ({onPress, text}) => {
  return (
    <TouchableHighlight style={styles.btn} onPress={onPress}>
      <Text style={styles.text}>{text}</Text>
    </TouchableHighlight>
  )
}

export default PermissionsBtn

const styles = StyleSheet.create({
    btn: {
        borderRadius: 5,
        alignItems: 'center',
        borderStyle: 'solid',
        borderBottomWidth: 1,
        borderWidth: .5,
        borderLeftWidth: 2,
        borderStartEndRadius: 20,
        padding: 10,
      },
      text: {
        fontSize: 16,
        fontWeight: '600',
      }
});