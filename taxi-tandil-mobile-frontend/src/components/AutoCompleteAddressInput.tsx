import { FC } from "react";
import { StyleSheet } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import constants from "../constants";
import { GOOGLE_MAPS_API_KEY } from "@env";
import { AutoCompleteRow } from "./AutoCompleteRow";

type AutoCompleteAddressInputProps = {
    dispatchAction: (param: {location: {lat: number, lng: number}, description: string} | null) => void,
    placeholder: string,
}

export const AutoCompleteAddressInput: FC<AutoCompleteAddressInputProps> = ({dispatchAction, placeholder}) => {
  return (
    <GooglePlacesAutocomplete styles={styles}
        GooglePlacesSearchQuery={{
            rankby: 'distance'
        }}
      placeholder={placeholder}
      fetchDetails={true}
      onPress={(data, details = null) => {
        if (details != null) {
          dispatchAction({
            location: {
              lat: details.geometry.location.lat,
              lng: details.geometry.location.lng,
            }, 
            description: details.address_components[1].long_name+" "+details.address_components[0].long_name
          })
        } else
          dispatchAction(null);
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
      renderRow={(data, index) => <AutoCompleteRow data={data} index={index}/>}
    />
  );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: 'white',
        fontSize: 18,
        paddingHorizontal: 20,
    },
    textInputContainer: {
    },
    textInput: {
        backgroundColor: '#DDDDDF',
    },
    listView: {
    },
    row: {
        paddingHorizontal: 0
    }
});