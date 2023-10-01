import { FC, PropsWithChildren, useEffect, useMemo, useState } from "react";
import { View, Button, Text } from "react-native";
import { Location, emitSendTaxiLocation, emitTripResponse, getSocket, joinRoom, onGetAllTaxisLocation, onTripRequest } from "../client-sockets/UserClientSocket";

type TripState = {
    exists: boolean,
    userLocation: Location,
    userId: string
}

export const TaxiPage: FC<PropsWithChildren> = () => {
    const [trip, setTrip] = useState<TripState>({
        exists: false,
        userLocation: {lat: 0, lon: 0},
        userId: ""
    });
    const [location, setLocation] = useState<Location>({
        lat: 52.5200,
        lon: 13.4050,
    });

    const socket = getSocket();
    socket.volatile.on("get-all-taxis-location", (userId: string) => {
        socket.emit("send-taxi-location", socket.id, location, userId);
    });

    useEffect(() => {
        onTripRequest(setTrip);
    }, []);

    return (
        <View>

            <Text>Current Location: {location.lat}, {location.lon}</Text>
            <Button title="Estoy disponible"
             onPress={() => {
                joinRoom('taxis-available');
            }}/>
             <Button title="Cambiar localizacion"
             onPress={() => {
                setLocation({lat: location.lat-1,lon: location.lon-1});
            }}
             />
            {trip.exists && 
            <>
            <Text>Nuevo viaje emitido por {trip.userId} en: {trip.userLocation.lat+" "+trip.userLocation.lon}</Text>
            <Button title="Aceptar viaje" onPress={() => {
                emitTripResponse(trip.userId, true);
            }}/>
            </>}
        </View>
    );
}