import { FC, PropsWithChildren, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { UserPage } from "./UserPage";
import { TaxiPage } from "./TaxiPage";
import { joinRoom } from "../client-sockets/UserClientSocket";


export const Home: FC<PropsWithChildren> = () => {
    
    const [rol, setRol] = useState<"user"|"taxi">();

    return (
        <View>
            {rol == undefined && 
            <View style={styles.container}>
                <Text>Seleccione su rol!</Text>
                <View>
                    <Button title="User" onPress={() => setRol("user")}/>
                    <Button title="Taxi" onPress={() => {
                        setRol("taxi");
                        joinRoom('taxi');
                    }}/>
                </View>
            </View>}
            {rol == 'user' && 
            <UserPage></UserPage>}
            {rol == 'taxi' && 
            <TaxiPage></TaxiPage>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
});