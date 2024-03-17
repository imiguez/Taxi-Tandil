import { FC, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableHighlight, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useHttpRequest } from "../hooks/useHttpRequest";
import { useAuthDispatchActions } from "../hooks/useAuthDispatchActions";

export const Login: FC = () => {
    const navigation = useNavigation();
    const [formEmail, setFormEmail] = useState<string>('');
    const [formPassword, setFormPassword] = useState<string>('');
    const {setUserAuthData} = useAuthDispatchActions();
    const {postRequest} = useHttpRequest();
    
    const onSubmitLogin = async () => {
        /**
         * TODO: 
         *  -Add a loading state when submit.
         *  -Handle the errors
        */
        let body = {
            email: formEmail,
            password: formPassword
        };
        try {
            const response = await postRequest('auth/login', body);
            let data = {
                id: response.user.id,
                firstName: response.user.firstName,
                lastName: response.user.lastName,
                email: response.user.email,
                roles: response.user.roles,
                access_token: response.access_token,
                refresh_token: response.refresh_token,
            }
            // Empty the email and password useStates.
            setFormEmail('');
            setFormPassword('');
            setUserAuthData(data);
            navigation.navigate('Main', {screen: 'Home', params: {screen: 'NewRide'}});
        } catch (error) {
            console.log(`error from catch: ${error}`);
        }
    }

    return (
        <View style={styles.homeContainer}>
            <View style={[styles.containers, styles.formContainer]}>
                <TextInput placeholder="Email" value={formEmail} onChangeText={text => setFormEmail(text)} style={styles.textInput}/>
                <TextInput placeholder="Contraseña" secureTextEntry value={formPassword} onChangeText={text => setFormPassword(text)} style={styles.textInput}/>
                <Text style={styles.link}>
                    Olvidaste la contraseña?
                </Text>
                <View style={styles.bar} />
                <TouchableHighlight style={styles.loginBtn} onPress={onSubmitLogin}>
                    <Text style={styles.loginText}>Iniciar sesión</Text>
                </TouchableHighlight>
            </View>
            <View style={[styles.containers, styles.optionsContainer]}>
                <Text>
                    No tenés una cuenta? 
                    <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}> Registrate aquí.</Text> 
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
        minHeight: 50,
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
    loginBtn: {
        width: '80%',
        backgroundColor: '#ffe700',
        paddingVertical: 10,
        borderRadius: 10,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#f9e200',
    },
    loginText: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700'
    },
    optionsContainer: {
        flex: .2,
    },
});