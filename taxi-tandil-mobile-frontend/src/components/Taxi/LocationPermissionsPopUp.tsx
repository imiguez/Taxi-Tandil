import { Button, Linking, StyleSheet, Text, View } from 'react-native'
import React from 'react'

const LocationPermissionsPopUp = () => {

  return (
    <View style={styles.popUpContainer}>
        <Text style={styles.text}>Para estar disponible se requiere tener la ubicación activada y otorgar el permiso: 'Permitir todo el tiempo'.</Text>
        <Button title="Ir a permisos" onPress={() => Linking.openSettings()}/>
    </View>
  )
}

export default LocationPermissionsPopUp

const styles = StyleSheet.create({
  popUpContainer: {
    width: '80%',
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'black',
    borderRadius: 5,
    backgroundColor: 'white',
    marginLeft: '10%',
  },
  text: {
    fontSize: 16,
    textAlign: 'justify',
    marginBottom: 20,
  }
});