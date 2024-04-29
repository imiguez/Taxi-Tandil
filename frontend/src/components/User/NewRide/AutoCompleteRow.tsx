import { FC } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GooglePlaceData } from "react-native-google-places-autocomplete";
import { screenWidth } from "constants/index";

type AutoCompleteRowProps = {
    data: GooglePlaceData,
    index: number
}

export const AutoCompleteRow: FC<AutoCompleteRowProps> = ({data, index}) => {

    const descriptionSplitted = data.description.split(', ');
    const shortAddress = `${descriptionSplitted[0]}`;
    let longAddress = '';
    for (let i = 1; i < descriptionSplitted.length; i++) {
        longAddress += descriptionSplitted[i];
        if (descriptionSplitted.length > i+1) longAddress += ', ';
    }
    
    return (
        <View style={styles.container}>
            <Text numberOfLines={1} style={[styles.common, styles.primaryText]}>{shortAddress}</Text>
            <Text numberOfLines={1} style={[styles.common, styles.secondaryText]}>{longAddress}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        maxWidth: screenWidth - 60,
        borderWidth: 0,
        borderColor: 'red',
        borderStyle: 'solid'
    },
    common: {
        padding: 0,
        margin: 0,
        flex: 1,
    },
    primaryText: {
        fontSize: 18,
        fontWeight: '500',
    },
    secondaryText: {
        fontSize: 14,
        fontWeight: '300'
    }
});