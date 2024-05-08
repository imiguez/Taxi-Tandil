import { StyleSheet, View } from 'react-native';
import React, { FC, ReactNode } from 'react';

const RideCardBtnsContainer: FC<{ children?: ReactNode }> = ({ children }) => {
  return <View style={styles.buttonsContainer}>{children}</View>;
};

export default RideCardBtnsContainer;

const styles = StyleSheet.create({
  buttonsContainer: {
    marginTop: 10,
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});