import { StyleSheet, Text, View } from 'react-native'
import React, { FC } from 'react'

interface SelectInMapErrorNotificationInterface {
  msg: string
}

const SelectInMapErrorNotification: FC<SelectInMapErrorNotificationInterface> = ({ msg }) => {
  return (
    <View style={styles.container}>
      <Text>{msg}</Text>
    </View>
  )
}

export default SelectInMapErrorNotification

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
    position: 'absolute',
    bottom: '20%',
    left: '10%',
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#c8c7cc'
  },
  text: {
    fontSize: 16,
  }
});