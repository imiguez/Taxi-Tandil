import { FC, PropsWithChildren, useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { emitNewTrip, joinRoom, onTaxiConfirmedTrip } from "../client-sockets/UserClientSocket";


export const UserPage: FC<PropsWithChildren> = () => {
    const location = {lat: 48.8566, lon: 2.3522};

    const [newTrip, setNewTrip] = useState<{exists: boolean, taxiId: string}>({
        exists: false,
        taxiId: ""
    });
    
    useEffect(() => {
        joinRoom('user');
        onTaxiConfirmedTrip(setNewTrip);
    }, []);

    return (
        <View>
            <Button title="Solicitar un viaje"
             onPress={() => emitNewTrip(location)}/>

            {newTrip.exists &&
             <Text>{newTrip.taxiId} acepto tu viaje!!</Text>}
        </View>
    );
}