import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import React, { FC } from 'react';

interface RideCardAddressLabelInterface {
  text: string;
  addStyles?: StyleProp<TextStyle>
}

const RideCardAddressLabel: FC<RideCardAddressLabelInterface> = ({ text, addStyles }) => {
  return (
    <Text numberOfLines={1} style={[styles.addressText, addStyles ?? {}]}>
      {text}
    </Text>
  );
};

export default RideCardAddressLabel;

const styles = StyleSheet.create({
  addressText: {
    backgroundColor: '#d1d1d18f',
    borderWidth: 1,
    borderColor: '#d1d1d1a8',
    borderStyle: 'solid',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 16,
    marginBottom: 10,
  },
});
