import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import React, { useCallback, useEffect, useState } from 'react'
import Ride from './Ride'
import { RideInterface } from 'types/Rides'
import { useAuthDispatchActions } from '@hooks/slices/useAuthDispatchActions'
import { useHttpRequest } from '@hooks/useHttpRequest'
import ScreenHeader from '../ScreenHeader'


const EmptyListMessage = () => (
  <View style={styles.emptyListContainer}>
    <Text style={styles.emptyListText}>No tenés viajes</Text>
  </View>
);

  const RidesList = () => {
  const { id } = useAuthDispatchActions();
  const { getRequest } = useHttpRequest();
  const [rides, setRides] = useState<RideInterface[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMoreRides, setHasMoreRides] = useState<boolean>(true);
  const [pageNumber, setPageNumber] = useState(0);
  const [total, setTotal] = useState<undefined|number>(undefined);

  useEffect(() => {
    (async () => {
      await fetchPaginatedRides();
      await fetchTotalRides();
    })
  }, []);

  const fetchTotalRides = async () => {
    try {
      const totalRides = await getRequest(`rides/count/${id}`);
      setTotal(totalRides);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  const fetchPaginatedRides = async () => {
    if (isLoading || !hasMoreRides) return;
    setIsLoading(true)
    try {
      const newRides = await getRequest(`rides/${id}/${pageNumber}`);
      setRides([...rides, ...newRides]);
      setPageNumber(pageNumber+1);
      if (newRides.length < 10) setHasMoreRides(false);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false)
    }
  };


  const keyExtractor = useCallback((item: any, i: number) => `${i}-${item.id}`, []);

  return (
    <>
      <ScreenHeader title='Viajes' >
        {/* <Text style={styles.text}>{total ? `Estas viendo ${rides.length} viajes de ${total}` : ''}</Text> */}
      </ScreenHeader>

      <FlashList scrollEnabled showsVerticalScrollIndicator 
        data={rides}
        renderItem={({item}) => <Ride {...item} />} 
        keyExtractor={keyExtractor}
        estimatedItemSize={(pageNumber+1)*10}
        onEndReached={fetchPaginatedRides}
        onEndReachedThreshold={0.1}
        contentContainerStyle={{paddingTop: 20}}
        ListEmptyComponent={isLoading ? <></> : <EmptyListMessage/>}
        ListFooterComponent={() => (
          isLoading ?
            <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="black" />
            : null
        )}
      />
    </>
  )
}

export default RidesList

const styles = StyleSheet.create({
  text: {
    paddingTop: 10,
    fontWeight: '500'
  },
  emptyListContainer: {
    marginTop: '80%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyListText: {
    fontSize: 16,
  },
});