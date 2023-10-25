import { FC, useContext } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SocketContext } from "../hooks/useSocketContext";

export const Login: FC = () => {
    const navigation = useNavigation();
    const socket = useContext(SocketContext);

    return (
        <View style={styles.homeContainer}>
            <View style={styles.rolsContainer}>
                <Text>Seleccione su rol!</Text>
                <View>
                    <Button title="User" onPress={() => {
                        socket.emit('join-room', 'user');
                        navigation.navigate('HomeStack', {screen: 'UserHome'});
                    }}/>
                    <Button title="Taxi" onPress={() => {
                        socket.emit('join-room', 'taxi');
                        navigation.navigate('HomeStack', {screen: 'TaxiHome'});
                    }}/>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    homeContainer: {
        flex: 1,
        padding: 0,
        margin: 0,
    },
    rolsContainer: {
      flex: 1,
      flexDirection: 'column',
      width: '100%',
      height: '10%',
      alignItems: 'center',
      justifyContent: 'center',
    },
});