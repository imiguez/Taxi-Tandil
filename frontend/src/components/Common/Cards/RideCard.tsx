import { StyleSheet, View } from 'react-native';
import React, { FC, ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { windowHeight } from '@constants/index';

const RideCard: FC<{ children?: ReactNode }> = ({ children }) => {
  return (
    <>
      <LinearGradient style={styles.shadow} locations={[0, 1]} colors={['transparent', '#0000006b']} />
      <View style={styles.cardContainer}>{children}</View>
    </>
  );
};

export default RideCard;

const styles = StyleSheet.create({
  cardContainer: {
    height: windowHeight * 0.3,
    minHeight: 230,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'white',
    paddingTop: 30,
    paddingHorizontal: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  shadow: {
    width: '100%',
    height: 40,
    position: 'absolute',
    bottom: (windowHeight * 0.3 >= 230) ? windowHeight * 0.3 - 30 : 200,
  },
});