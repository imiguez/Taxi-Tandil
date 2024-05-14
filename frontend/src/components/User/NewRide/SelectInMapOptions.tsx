import { FC, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Entypo } from '@expo/vector-icons';
import { TouchableHighlight } from "react-native-gesture-handler";
import { screenWidth } from "constants/index";

type SelectInMapOptionsProps = {
    onConfirm: () => Promise<void>,
    onCancel: () => void,
}

export const SelectInMapOptions: FC<SelectInMapOptionsProps> = ({onConfirm,onCancel}) => {

    const [loadingReverseGeocoding, setLoadingReverseGeocoding] = useState<boolean>(false);
    
    return (
        <View style={styles.container}>
            {loadingReverseGeocoding ? <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} /> :
            <>
                <TouchableHighlight style={[styles.btns, {backgroundColor: '#f95959'}]} onPress={onCancel}>
                    <Entypo name="cross" size={30} color="white" />
                </TouchableHighlight>
                <View style={styles.msgContainer}>
                    <Text style={styles.msg}>Mantenga pulsado el pin para poder arrastrarlo.</Text>
                </View>
                <TouchableHighlight style={[styles.btns, {backgroundColor: '#8ded8e'}]} onPress={async () => {
                    setLoadingReverseGeocoding(true);
                    await onConfirm();
                    setLoadingReverseGeocoding(false);
                }}>
                    <Entypo name="check" size={30} color="white" />
                </TouchableHighlight>
            </>
            }
        </View>
    ); 
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        backgroundColor: '#00000040',
        paddingTop: 10,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        width: '100%',
        height: 80,
        borderWidth: 0,
        borderColor: 'red',
        borderStyle: 'solid',
    },
    msgContainer: {
        width: (screenWidth-110)*.8,
        backgroundColor: '#ffffffe3',
        borderRadius: 5,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    msg: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center'
    },
    btns: {
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        elevation: 8,
    }
});