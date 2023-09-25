import { FC, PropsWithChildren, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { TaxiPage } from "./TaxiPage";
import { joinRoom } from "../client-sockets/UserClientSocket";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";


export const Home: FC = () => {
    
    const navigation = useNavigation();
    const [rol, setRol] = useState<"user"|"taxi">();

    return (
        <View style={styles.homeContainer}>
            {
            //rol == undefined &&
            <View style={styles.rolsContainer}>
                <Text>Seleccione su rol!</Text>
                <View>
                    <Button title="User" onPress={() => {
                        setRol("user");
                        navigation.navigate("UserHomeScreen");
                    }}/>
                    <Button title="Taxi" onPress={() => {
                        setRol("taxi");
                        joinRoom('taxi');
                    }}/>
                </View>
            </View>}
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