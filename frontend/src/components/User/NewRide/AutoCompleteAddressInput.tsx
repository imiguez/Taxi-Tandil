import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, NativeSyntheticEvent, StyleSheet, TextInputChangeEventData, View } from "react-native";
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from "react-native-google-places-autocomplete";
import { AutoCompleteRow } from "./AutoCompleteRow";
import { CurrentLocationInBetweenCompo } from "./CurrentLocationInBetweenCompo";
import { SelectInMapInBetweenCompo } from "./SelectInMapInBetweenCompo";
import { screenWidth, tandilLocation } from "constants/index";
import { useMapDispatchActions } from "hooks/slices/useMapDispatchActions";

type AutoCompleteAddressInputProps = {
    placeholder: string,
    set: 'origin' | 'destination',
};

export const AutoCompleteAddressInput: FC<AutoCompleteAddressInputProps> = ({placeholder, set}) => {
  const ref = useRef<GooglePlacesAutocompleteRef>(null);
  const {setLocation, origin, destination, selectInMap, setFocusInput, focusInput, rideStatus, rideDistance} = useMapDispatchActions();
  const [isFocus, setIsFocus] = useState<boolean>(false);

  const setInputValue = (address: string) => {
    if (ref.current)
      ref.current.setAddressText(address);
  }

  useEffect(() => {
    let address: string = '';
    if (set == 'origin'){
      if (!origin) {
        ref.current?.focus();
        setIsFocus(true);
      }
      address = origin ? origin.longAddress : '';
    } else {
      address = destination ? destination.longAddress : '';
      if (origin && destination) {
        Keyboard.dismiss();
      } else if (origin) {
        // Comented lines because after setting the origin its not necesary to automaticaly set focus in the destination input.
        // ref.current?.focus();
        // setIsFocus(true);
      }
    }
    
    setInputValue(address);
  }, set == 'origin' ? [origin] : [origin, destination]);

  useMemo(() => {
    if (!focusInput) {
      setIsFocus(false);
      ref.current?.blur();
    }
  }, [focusInput]);

  return (
    <GooglePlacesAutocomplete 
      styles={{
        container: styles.container,
        textInputContainer: styles.textInputContainer,
        textInput: styles.textInput,
        listView: {
          borderWidth: 0,
          borderColor: 'red',
          borderStyle: 'solid',
          width: screenWidth,
          position: 'absolute',
          left: ((screenWidth-20)*-.12)-10, 
          top: set == 'destination' ? (rideDistance ? 234 : 195) : (rideDistance ? 284 : 245),
        }
      }}
      ref={ref}
      GooglePlacesSearchQuery={{
          rankby: 'distance'
      }}
      placeholder={placeholder}
      textInputProps={{
        onFocus: () => {
          setIsFocus(true);
          setFocusInput(set);
        },
        onBlur: () => setIsFocus(false),
        onChange: (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
          if (e.nativeEvent.text === '') setLocation(null, set);
        },
        editable: !selectInMap && !rideStatus,
      }}
      fetchDetails={true}
      onPress={(data, details = null) => {
        if (details != null) {
          setLocation({
            location: {
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
            }, 
            longAddress: details.formatted_address,
            shortAddress: details.address_components[1].long_name+" "+details.address_components[0].long_name,
          }, set);
          setInputValue(details.formatted_address);
        } else
          setLocation(null, set);
      }}
      requestUrl={{
        useOnPlatform: 'all',
        url:
          'https://maps.googleapis.com/maps/api',
        headers: {
          "X-Android-Package": "com.imiguez.ride",
          "X-Android-Cert": process.env.EXPO_PUBLIC_SHA_1!
        },
      }}
      query={{
        key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        language: "es",
        components: 'country:ar',
        types: 'address',
        radius: 30000,
        location: `${tandilLocation.latitude}, ${tandilLocation.longitude}`,
      }}
      nearbyPlacesAPI="GooglePlacesSearch"
      debounce={1400}
      minLength={2}
      onFail={(error) => console.log(error)}
      enablePoweredByContainer={false}
      disableScroll={false}
      enableHighAccuracyLocation={true}
      renderRow={(data, index) => <AutoCompleteRow data={data} index={index}/>}
      inbetweenCompo={<View style={{
        display: isFocus && !selectInMap ? 'flex' : 'none',
        width: screenWidth,
        position: 'absolute',
        borderWidth: 0,
        borderColor: 'red',
        borderStyle: 'solid',
        top: set=='origin' ? (rideDistance ? 144 : 105) : (rideDistance ? 94 : 55),
        left: ((screenWidth-20)*-.12) - 10,
      }}>
        <CurrentLocationInBetweenCompo set={set} />
        <SelectInMapInBetweenCompo />
      </View>}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 50,
    backgroundColor: 'white',
    fontSize: 18,
    margin: 0,
    paddingHorizontal: 0,
    borderWidth: 0,
    borderColor: 'red',
    borderStyle: 'solid',
    paddingTop: 5,
  },
  textInputContainer: {
    display: 'flex',
    alignItems: 'center',
    height: 40,
    borderWidth: 0,
    borderColor: 'red',
    borderStyle: 'solid'
  },
  textInput: {
    backgroundColor: '#DDDDDF',
    height: 40,
    marginBottom: 0,
    borderWidth: 0,
    borderColor: 'red',
    borderStyle: 'solid'
  },
});