import { StyleSheet, View } from 'react-native';
import React, { FC, ReactNode, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { windowHeight } from '@constants/index';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface IRideCard {
  minYTranslation?: number,
  maxYTranslation?: number,
  initialPosition?: number,
  children?: ReactNode,
}

const RideCard: FC<IRideCard> = ({ maxYTranslation, minYTranslation, initialPosition, children }) => {
  const translateY = useSharedValue(0);
  const context = useSharedValue({y: 0})

  const gesture = Gesture.Pan()
  .onStart(() => {
    context.value = {y: translateY.value};
  })
  .onUpdate((event) => {
    translateY.value = event.translationY + context.value.y;
    if ((maxYTranslation ?? -windowHeight) > translateY.value) translateY.value = maxYTranslation ?? -windowHeight;
    else if ((minYTranslation ?? 0) < translateY.value) translateY.value = minYTranslation ?? 0;
  });

  const containerAnimatedStyles = useAnimatedStyle(() => ({transform: [{translateY: translateY.value}]}));

  useEffect(() => {
    translateY.value = withTiming(initialPosition ?? -windowHeight/2, {
      duration: 200,
      easing: Easing.out(Easing.quad)
    });
  }, []);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, containerAnimatedStyles]}>
        <LinearGradient style={[styles.shadow]} locations={[0, 1]} colors={['transparent', '#0000006b']} />
        
        <View style={styles.cardContainer}>
          <View style={styles.line}/>
          {children}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export default RideCard;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    top: windowHeight,
    height: windowHeight,
  },
  shadow: {
    width: '100%',
    height: 40,
    position: 'absolute',
    top: 0,
    zIndex: -1
  },
  cardContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    top: 10,
    paddingHorizontal: 25,
    backgroundColor: 'white',
  },
  line: {
    width: 70,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 15,
    backgroundColor: 'grey'
  },
});