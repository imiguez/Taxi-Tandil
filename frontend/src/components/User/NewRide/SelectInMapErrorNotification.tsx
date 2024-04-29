import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const SelectInMapErrorNotification = () => {
  return (
    <View style={styles.container}>
      <Text>No se pudo detectar una dirección valida, intente nuevamente.</Text>
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
        height: '10%',
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