import { Animated, Easing, StyleSheet } from 'react-native'
import React, { FC, useEffect, useRef, useState } from 'react'
import { screenWidth } from '@constants/index';

const CountdownBar: FC= () => {
    const progress = useRef(new Animated.Value(0)).current;
    const [color, setColor] = useState<string>('#8ded8e');

    useEffect(() => {
        Animated.timing(progress, {
            toValue: -screenWidth,
            duration: 20000,
            easing(value) {
                return Easing.linear(value);
            },
            useNativeDriver: true,
        }).start();
        setTimeout(() => {
            setColor('#f95959');
        }, 15000);
    }, []);

  return (
    <Animated.View style={[styles.bar, {
        backgroundColor: color,
        transform: [{translateX: progress}]
      }]}/>
  )
}

export default CountdownBar

const styles = StyleSheet.create({
    bar: {
        width: '100%',
        height: 10,
        position: 'absolute',
        bottom: 70,
    },
});