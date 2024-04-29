import { useMapDispatchActions } from "hooks/slices/useMapDispatchActions";
import { FC } from "react";
import { Keyboard, StyleSheet, Text, TouchableHighlight } from "react-native";

export const SelectInMapInBetweenCompo: FC = () => {
  const {setSelectInMap} = useMapDispatchActions();

    const onPressedBtn = () => {
        Keyboard.dismiss();
        setSelectInMap(true);
    };

    return (
        <TouchableHighlight style={styles.container} onPress={onPressedBtn} >
            <Text style={styles.text}>Seleccionar en el mapa</Text>
        </TouchableHighlight>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        padding: 13,
        alignItems: 'center',
        minHeight: 70,
        // minHeight: 44,
        flexDirection: 'row',
        width: '100%',
        borderBottomWidth: 1,
        borderColor: '#c8c7cc',
        borderStyle: 'solid',
    },
    text: {
        fontSize: 18,
        fontWeight: '700',
        borderWidth: 0,
        borderColor: '#c8c7cc',
        borderStyle: 'solid',
    }
});