import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Ride from './Ride'
import { RideInterface } from 'types/Rides'


const data: RideInterface[] = [
    {
        id: 1,
        taxi_username: 'Jhon Jonnas',
        origin_long_name: 'pepe 12',
        origin_lat: -37.32427812304469,
        origin_lng: -59.14159633219242,
        destination_long_name: 'pasa 34',
        destination_lat: -37.331554819241205,
        destination_lng: -59.12714827805757,
        created_at: new Date(),
        accepted_timestamp: new Date(),
        arrived_timestamp: new Date(),
        finished_timestamp: new Date(),
        was_cancelled: false,
        cancellation_reason: null,
    },
    {
        id: 2,
        taxi_username: 'Jhon Jonnas',
        origin_long_name: 'pepe 12',
        origin_lat: -37.32427812304469,
        origin_lng: -59.14159633219242,
        destination_long_name: 'pasa 34',
        destination_lat: -37.331554819241205,
        destination_lng: -59.12714827805757,
        created_at: new Date(),
        accepted_timestamp: new Date(),
        arrived_timestamp: new Date(),
        finished_timestamp: new Date(),
        was_cancelled: false,
        cancellation_reason: null,
    },
    {
        id: 3,
        taxi_username: 'Jhon Jonnas',
        origin_long_name: 'pepe 12',
        origin_lat: -37.32427812304469,
        origin_lng: -59.14159633219242,
        destination_long_name: 'pasa 34',
        destination_lat: -37.331554819241205,
        destination_lng: -59.12714827805757,
        created_at: new Date(),
        accepted_timestamp: new Date(),
        arrived_timestamp: new Date(),
        finished_timestamp: new Date(),
        was_cancelled: false,
        cancellation_reason: null,
    }, {
        id: 4,
        taxi_username: 'Jhon Jonnas',
        origin_long_name: 'pepe 12',
        origin_lat: -37.32427812304469,
        origin_lng: -59.14159633219242,
        destination_long_name: 'pasa 34',
        destination_lat: -37.331554819241205,
        destination_lng: -59.12714827805757,
        created_at: new Date(),
        accepted_timestamp: new Date(),
        arrived_timestamp: new Date(),
        finished_timestamp: new Date(),
        was_cancelled: false,
        cancellation_reason: null,
    },    {
        id: 5,
        taxi_username: 'Jhon Jonnas',
        origin_long_name: 'pepe 12',
        origin_lat: -37.32427812304469,
        origin_lng: -59.14159633219242,
        destination_long_name: 'pasa 34',
        destination_lat: -37.331554819241205,
        destination_lng: -59.12714827805757,
        created_at: new Date(),
        accepted_timestamp: new Date(),
        arrived_timestamp: new Date(),
        finished_timestamp: new Date(),
        was_cancelled: false,
        cancellation_reason: null,
    },    {
        id: 6,
        taxi_username: 'Jhon Jonnas',
        origin_long_name: 'pepe 12',
        origin_lat: -37.32427812304469,
        origin_lng: -59.14159633219242,
        destination_long_name: 'pasa 34',
        destination_lat: -37.331554819241205,
        destination_lng: -59.12714827805757,
        created_at: new Date(),
        accepted_timestamp: new Date(),
        arrived_timestamp: new Date(),
        finished_timestamp: new Date(),
        was_cancelled: false,
        cancellation_reason: null,
    }
]

const RidesList = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 200);
    }, []);

  return (
    <View style={{ flex: 1 }}>
      {isLoading ? (
        <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />
      ) : (
        <FlatList style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
        scrollEnabled showsVerticalScrollIndicator 
          data={data}
          renderItem={({item}) => <Ride {...item} />}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
    </View>
  )
}

export default RidesList

const styles = StyleSheet.create({
    flatList: {
        maxHeight: '100%',
        paddingTop: 20,
    },
    flatListContent: {
        alignItems: 'center',
        paddingBottom: 30,
    }
});