import { FC, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import constants from "../../constants";

type SelectInMapOptionsProps = {
    onConfirm: () => Promise<void>,
    onCancel: () => void,
}

export const SelectInMapOptions: FC<SelectInMapOptionsProps> = ({onConfirm,onCancel}) => {

    const [loadingReverseGeocoding, setLoadingReverseGeocoding] = useState<boolean>(false);
    
    return (
        <View style={styles.container}>
            {!loadingReverseGeocoding &&
            <>
                <TouchableHighlight style={styles.btns} onPress={onCancel}>
                    <Text>Cancel</Text>
                </TouchableHighlight>
                <View style={styles.msg}>
                    <Text>Mantenga pulsado el pin para poder arrastrarlo.</Text>
                </View>
                <TouchableHighlight style={styles.btns} onPress={async () => {
                    setLoadingReverseGeocoding(true);
                    await onConfirm();
                    setLoadingReverseGeocoding(false);
                }}>
                    <Text>Confirm</Text>
                </TouchableHighlight>
            </>
            }
            {loadingReverseGeocoding &&
                <Text>Cargando...</Text>
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
    msg: {
        width: (constants.screenWidth-110)*.8,
        backgroundColor: '#ffffffe3',
        borderRadius: 5,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    btns: {
        width: 45,
        height: 45,
        backgroundColor: 'white',
        borderRadius: 5,
        elevation: 8,
    }
});