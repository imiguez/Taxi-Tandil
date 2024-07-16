import { Animated, AppState, AppStateStatus, Easing, StyleSheet, Text, View } from 'react-native'
import React, { FC, useEffect, useRef, useState } from 'react'
import { screenWidth } from '@constants/index';

interface ICountdownBar {
    expiresAt: number,
}

const CountdownBar: FC<ICountdownBar> = ({ expiresAt }) => {
    const progress = useRef(new Animated.Value(0)).current;
    const countdown = useRef(expiresAt - Date.now());
    const [color, setColor] = useState<string>('#8ded8e');
    const [countdownText, setCountdownText] = useState<string>('');
    
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
            countdown.current = (expiresAt - Date.now());
            Animated.timing(progress, {
                toValue: -screenWidth,
                duration: countdown.current,
                easing(value) {
                    return Easing.linear(value);
                },
                useNativeDriver: true,
            }).start();
        }
        AppState.currentState = nextAppState;
    }


    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        Animated.timing(progress, {
            toValue: -screenWidth,
            duration: countdown.current,
            easing(value) {
                return Easing.linear(value);
            },
            useNativeDriver: true,
        }).start();
        
        setTimeout(() => {
            setColor('#f95959');
        }, Math.floor((countdown.current/4)*3));

        let interval = setInterval(() => {
            let expiresIn = Math.floor((expiresAt - Date.now())/1000);
            if (expiresIn > 0) setCountdownText(expiresIn+'');
            else clearInterval(interval);
        }, 1000);

        return () => {
            subscription.remove();
            clearInterval(interval);
          };
    }, []);

  return (
    <>
        <View style={[styles.bar, styles.background]} />
        <View style={[styles.bar, styles.container]}>
            <Text style={styles.text}>{countdownText}</Text>
        </View>
        <Animated.View style={[styles.bar, {
            backgroundColor: color,
            zIndex: 2,
            transform: [{translateX: progress}]
        }]} />
    </>
  )
}

export default CountdownBar

const styles = StyleSheet.create({
    background: {
        backgroundColor: 'white',
        zIndex: 1,
    },
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
        borderTopWidth: 1,
        borderColor: '#d8d7d7',
    },
    bar: {
        width: '100%',
        height: 20,
        position: 'absolute',
        bottom: 70,
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
    }
});