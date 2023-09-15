import { FC } from "react";
import { StyleSheet } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import constants from "../constants";
import { GOOGLE_MAPS_API_KEY } from "@env";

type AutoCompleteAddressInputProps = {
    dispatchAction: (location: {lat: number, lng: number} | null) => void,
}

export const AutoCompleteAddressInput: FC<AutoCompleteAddressInputProps> = ({dispatchAction}) => {
  return (
    <GooglePlacesAutocomplete styles={styles}
        GooglePlacesSearchQuery={{
            rankby: 'distance'
        }}
      placeholder="Buscar..."
      fetchDetails={true}
      onPress={(data, details = null) => {
        console.log(details?.geometry.location);
        console.log(details?.address_components[1].long_name+" "+details?.address_components[0].long_name);
        dispatchAction(details == null ? null : details.geometry.location);
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
    />
  );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: '100%',
        zIndex: 2,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: 'white',
        fontSize: 18,
    },
    textInputContainer: {
        paddingHorizontal: 20,
    },
    textInput: {
        backgroundColor: '#DDDDDF',
    },
    listView: {
        paddingHorizontal: 20,
    },
    row: {
        alignContent: 'center'
    },
});