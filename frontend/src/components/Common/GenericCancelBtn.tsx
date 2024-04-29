import { StyleSheet, Text, TouchableHighlight } from 'react-native'
import React, { FC } from 'react'

type GenericCancelBtnProps = {
  onPress: () => void
}

const GenericCancelBtn: FC<GenericCancelBtnProps> = ({onPress}) => {
  return (
    <TouchableHighlight style={styles.btn} onPress={onPress} underlayColor={'#e10606'}>
      <Text style={styles.text}>Cancelar</Text>
    </TouchableHighlight>
  )
}

export default GenericCancelBtn

const styles = StyleSheet.create({
  btn: {
    borderColor: '#e10606',
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
    color: '#e10606',
    fontSize: 16,
    fontWeight: '600',
  }
});