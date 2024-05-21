import { FC, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useMapDispatchActions } from "hooks/slices/useMapDispatchActions";
import { useCommonSlice } from "@hooks/slices/useCommonSlice";
import { NotificationsMap } from "@constants/index";
import ConfirmedRideBtn from "./ConfirmedRideBtn";
import RideCard from "@components/Common/Cards/RideCard";
import RideCardBtnsContainer from "@components/Common/Cards/RideCardBtnsContainer";


export const ConfirmedRideCard: FC = () => {
    const {origin, destination, rideStatus, taxi} = useMapDispatchActions();
    const { notifications } = useCommonSlice();
    const [msg, setMsg] = useState<string>("Esperando taxi...");
    const [taxiDisconnected, setTaxiDisconnected] = useState<boolean>(false);

    useMemo(() => {
        let newMsg = '';
        switch (rideStatus) {
            case 'accepted':
                newMsg = taxi?.username === null || taxi?.username === undefined ? '' : `${taxi?.username} acepto tu viaje!`;
            break;
            case 'no-taxis-available':
                newMsg = 'Actualmente no hay taxis disponibles.';
            break;
            case 'all-taxis-reject':
                newMsg = 'Ningun taxi disponible tomo el viaje.';
            break;
            case 'arrived':
                newMsg = taxi?.username === null || taxi?.username === undefined  ? '' : `${taxi?.username} ya llegó!`;
            break;
            default:
                newMsg = 'Esperando taxi...';
            break;
        }
        setMsg(newMsg);
    }, [rideStatus]);

    useMemo(() => {
        let showCancelBtnBecauseTaxiDisconnect = false;
        notifications.forEach(notification => {
            if (notification === 'Taxi disconnected') showCancelBtnBecauseTaxiDisconnect = true;
        });
        setTaxiDisconnected(showCancelBtnBecauseTaxiDisconnect);
    }, [notifications]);

    return (
        <RideCard>
            <View>
                <Text numberOfLines={1} style={styles.addressText}>{origin?.longAddress}</Text>
                <Text numberOfLines={1} style={styles.addressText}>{destination?.longAddress}</Text>
            </View>

            <View >
                <Text>{ taxiDisconnected ? NotificationsMap.get('Taxi disconnected') : msg }</Text>
            </View>

            <RideCardBtnsContainer>
                <ConfirmedRideBtn taxiDisconnected={taxiDisconnected} />
            </RideCardBtnsContainer>
        </RideCard>
    );
};

const styles = StyleSheet.create({
    addressText: {
        backgroundColor: '#d1d1d18f',
        borderWidth: 1,
        borderColor: '#d1d1d1a8',
        borderStyle: 'solid',
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        fontSize: 16,
        marginBottom: 10,
    },
});