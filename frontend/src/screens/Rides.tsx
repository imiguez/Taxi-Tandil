import { StyleSheet, View } from 'react-native'
import React from 'react'
import RidesList from '@components/Common/Rides/RidesList';

const Rides = () => {

  return (
    <View style={styles.container}>
      <RidesList />
    </View>
  )
}

export default Rides

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});