import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { FC } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { RideInterface } from 'types/Rides';
import { screenWidth } from '@constants/index';
import { DatesHelper } from '@utils/DatesHelper';
import { EnglishMonthsAbbreviation } from 'types/Dates';

const Ride: FC<RideInterface> = (ride) => {
  const createdAtTimeSplitted = new Date(ride.created_at).toLocaleString('es-AR', {timeZone: 'America/Argentina/Buenos_Aires'}).split(' ')[1].split(':');
  const createdAtDateSplitted = (new Date(ride.created_at).toString()).split(' ');
  const createdAtMonth = DatesHelper.monthsAbbreviationsMap.get(createdAtDateSplitted[1] as EnglishMonthsAbbreviation);


  return (
    <TouchableOpacity style={styles.btnContainer} >
      <View style={styles.rideContainer}>
        <MaterialIcons name="local-taxi" size={50} color={'black'} />

        <View style={styles.addressContainer}>
          <Text style={styles.addressText}>{ride.destination_long_name}</Text>
          
          <ImageBackground source={require('@assets/GoogleMapsBackgroundMap.jpg')} resizeMode="cover" style={styles.mapContainer}>
          </ImageBackground>

          <View style={styles.datesContainer}>
            <Text style={styles.date}>{`${createdAtDateSplitted[2]} ${createdAtMonth} - ${createdAtTimeSplitted[0]}:${createdAtTimeSplitted[1]}`}</Text>
            <Text style={styles.date}>{`${createdAtDateSplitted[3]}`}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default Ride;

const styles = StyleSheet.create({
  btnContainer: {
    width: screenWidth*.8,
    borderRadius: 10,
    borderColor: 'black',
    elevation: 8,
    marginVertical: 10,
    backgroundColor: 'white',
  },
  rideContainer: {
    alignItems: 'center',
    padding: 10,
    display: 'flex',
    flexDirection: 'row',
  },
  addressContainer: {
    width: (screenWidth*.8)-20-50,
    paddingLeft: 10,
  },
  addressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContainer: {
    height: 50,
    borderColor: '#d8d7d7',
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  datesContainer: {
    width: '100%',
    paddingRight: 5,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  date: {
    fontSize: 12,
    fontWeight: '600',
  }
});
