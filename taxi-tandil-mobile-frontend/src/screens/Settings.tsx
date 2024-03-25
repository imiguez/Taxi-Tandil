import { FC, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuthDispatchActions } from "../hooks/useAuthDispatchActions";
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import WorkWithUsModal from "../components/Common/Settings/WorkWithUsModal";
import LogoutModal from "../components/Common/Settings/LogoutModal";

export const Settings: FC = () => {
    const {firstName, lastName} = useAuthDispatchActions();
    const [showLogoutPopUp, setShowLogoutPopUp] = useState<boolean>(false);
    const [showWorkWithUs, setShowWorkWithUs] = useState<boolean>(false);
    const settingsContainer = useRef<View>(null);

    const showPopUp = (setShow: (b: boolean) => void, show: boolean) => {
        setShow(show);
        if (settingsContainer.current)
            settingsContainer.current.setNativeProps({opacity: show ? 0.3 : 1});
    }

    return (
        <View ref={settingsContainer} style={[styles.mainContainer, showWorkWithUs ? {opacity: 0.3} : {}]}>
            <Text style={styles.name}>{`${firstName} ${lastName}`}</Text>
            <View style={styles.card}>
                <TouchableOpacity style={styles.cardRow} onPress={() => showPopUp(setShowWorkWithUs, true)}>
                    <FontAwesome name="id-card-o" size={24} color="black" />
                    <Text>¿Querés trabajar con nostros?</Text>
                </TouchableOpacity>
                {showWorkWithUs && 
                    <WorkWithUsModal close={() => showPopUp(setShowWorkWithUs, false)} />
                }
                <TouchableOpacity style={styles.cardRow} onPress={() => showPopUp(setShowLogoutPopUp, true)} >
                    <Ionicons name="log-out-outline" size={24} color="black" />
                    <Text>Cerrar sesión</Text>
                </TouchableOpacity>
                {showLogoutPopUp && 
                    <LogoutModal close={() => showPopUp(setShowLogoutPopUp, false)} />
                }
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        alignItems: 'center',
    },
    name: {
        width: '70%',
        marginTop: 40,
        fontSize: 20,
        fontWeight: "bold",
        textAlign: 'center'
    },
    card: {
        width: '80%',
        marginTop: 40,
        borderWidth: 1,
        borderColor: '#d8d7d7',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    cardRow: {
        minHeight: 30,
        width: '100%',
        paddingVertical: 10,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
})