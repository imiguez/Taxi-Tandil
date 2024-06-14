import { StyleSheet, Text, View } from 'react-native';
import React, { FC, ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { screenHeight } from '@constants/index';

interface IScreenHeader {
  title: string,
  children?: ReactNode
}

const ScreenHeader: FC<IScreenHeader> = ({ title, children }) => {
  return (
    <>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </View>
      <LinearGradient style={[styles.linearGradient]} locations={[0.2, 1]} colors={['#0000002b', 'transparent']} />
    </>
  );
};

export default ScreenHeader;

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    paddingTop: 40,
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomColor: 'rgb(216, 216, 216)',
    height: screenHeight * 0.12,
    borderColor: 'black',
  },
  title: {
    fontSize: 20,
    fontFamily: 'sans-serif-medium',
    fontWeight: 'normal',
    color: 'rgb(28, 28, 30)',
  },
  linearGradient: {
    position: 'absolute',
    top: screenHeight * 0.12,
    width: '100%',
    zIndex: 1,
    height: 20,
  },
});
