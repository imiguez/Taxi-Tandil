import { FC, PropsWithChildren } from "react";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";
import { useNavigation } from "@react-navigation/native";


export const UserHome: FC<PropsWithChildren> = () => {
    const navigator = useNavigation();

    return (
        <View style={styles.mainContainer}>
            <TouchableHighlight style={styles.touch} 
                onPress={() => navigator.navigate('HomeStack', {screen: 'NewRide'})}>
                <Text>Pedir viaje</Text>
            </TouchableHighlight>

        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        display: 'flex',
        backgroundColor: 'white',
        borderWidth: 0,
        borderStyle: 'solid',
        borderColor: 'red',
        padding: 0,
    },
    touch: {
        width: '70%', 
        height: 80, 
        elevation: 5,
        borderRadius: 5,
        borderTopWidth: 0,
        borderStyle: 'solid',
        borderColor: 'red',
        marginLeft: '15%',
        justifyContent: 'center',
        alignItems: 'center'
    }
});