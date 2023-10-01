import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from "react-native-google-places-autocomplete";
import constants from "../../constants";
import { GOOGLE_MAPS_API_KEY } from "@env";
import { AutoCompleteRow } from "./AutoCompleteRow";
import { useMapDispatchActions } from "../../hooks/useMapDispatchActions";
import { CurrentLocationInBetweenCompo } from "./CurrentLocationInBetweenCompo";
import { SelectInMapInBetweenCompo } from "./SelectInMapInBetweenCompo";

type AutoCompleteAddressInputProps = {
    placeholder: string,
    set: 'origin' | 'destination',
};

export const AutoCompleteAddressInput: FC<AutoCompleteAddressInputProps> = ({placeholder, set}) => {
  const ref = useRef<GooglePlacesAutocompleteRef>(null);
  const {setLocation, origin, destination, selectInMap, setFocusInput} = useMapDispatchActions();
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
      address = origin ? origin.longStringLocation : '';
    } else {
      address = destination ? destination.longStringLocation : '';
      if (origin && destination) {
        Keyboard.dismiss();
      } else if (origin) {
        ref.current?.focus();
        setIsFocus(true);
      }
    }
    
    setInputValue(address);
  }, set == 'origin' ? [origin] : [origin, destination]);

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
          width: constants.screenWidth,
          position: 'absolute',
          left: ((constants.screenWidth-20)*-.12)-10, 
          top: set == 'destination' ? 195 : 245,
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
      }}
      fetchDetails={true}
      onPress={(data, details = null) => {
        if (details != null) {
          setLocation({
            location: {
              lat: details.geometry.location.lat,
              lng: details.geometry.location.lng,
            }, 
            longStringLocation: details.formatted_address,
            shortStringLocation: details.address_components[1].long_name+" "+details.address_components[0].long_name,
          }, set);
          setInputValue(details.formatted_address);
        } else
          setLocation(null, set);
      }}
      query={{
        key: GOOGLE_MAPS_API_KEY,
        language: "es",
        components: 'country:ar',
        types: 'address',
        radius: 30000,
        location: `${constants.tandilLocation.latitude}, ${constants.tandilLocation.longitude}`,
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
        width: constants.screenWidth,
        position: 'absolute',
        borderWidth: 0,
        borderColor: 'red',
        borderStyle: 'solid',
        top: set=='origin' ? 105 : 55,
        left: ((constants.screenWidth-20)*-.12) - 10,
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