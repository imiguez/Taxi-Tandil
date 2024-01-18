import { StyleSheet, Text, TextInput, TouchableHighlight, View } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

export const SignUp = () => {
    const navigation = useNavigation();
    const [formFirstName, setFormFirstName] = useState<string>('');
    const [formLastName, setFormLastName] = useState<string>('');
    const [formEmail, setFormEmail] = useState<string>('');
    const [formPassword, setFormPassword] = useState<string>('');
    const [formConfirmPassword, setFormConfirmPassword] = useState<string>('');

    return (
        <View style={styles.homeContainer}>
            <View style={[styles.containers, styles.formContainer]}>
                <TextInput placeholder='Nombre' value={formFirstName} onChangeText={text => setFormFirstName(text)} style={styles.textInput}/>
                <TextInput placeholder='Apellido' value={formLastName} onChangeText={text => setFormLastName(text)} style={styles.textInput}/>
                <TextInput placeholder='Email' value={formEmail} onChangeText={text => setFormEmail(text)} style={styles.textInput}/>
                <TextInput placeholder='Contraseña' secureTextEntry value={formPassword} onChangeText={text => setFormPassword(text)} style={styles.textInput}/>
                <TextInput placeholder='Confirme contraseña' secureTextEntry value={formConfirmPassword} onChangeText={text => setFormConfirmPassword(text)} style={styles.textInput}/>

                <View style={styles.bar} />

                <TouchableHighlight style={styles.signUpBtn} onPress={() => {}}>
                    <Text style={styles.signUpText}>Registrarse</Text>
                </TouchableHighlight>
            </View>

            <View style={[styles.containers, styles.optionsContainer]}>
                <Text>
                    Ya tenés una cuenta? 
                    <Text style={styles.link} onPress={() => navigation.navigate('Login')}> Inicia sesión aquí.</Text> 
                </Text>
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
    containers: {
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    formContainer: {
        flex: .8,
    },
    textInput: {
        minWidth: '80%',
        height: 50,
        fontSize: 18,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#ececec',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#d9d9d9',
        borderRadius: 10,
        marginVertical: 5,
    },
    link: {
        color: '#1877f2',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 15,
    },
    bar: {
        width: '60%',
        height: 1,
        backgroundColor: '#d9d9d9',
        marginVertical: 20,
    },
    signUpBtn: {
        width: '80%',
        backgroundColor: '#ffe700',
        paddingVertical: 10,
        borderRadius: 10,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#f9e200',
    },
    signUpText: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700'
    },
    optionsContainer: {
        flex: .2,
    },
});