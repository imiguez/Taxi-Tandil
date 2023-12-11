import { FC, useContext, useState } from "react";
import { Button, StyleSheet, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SocketContext } from "../hooks/useSocketContext";
import { useHttpRequest } from "../hooks/useHttpRequest";
import { useAuthDispatchActions } from "../hooks/useAuthDispatchActions";
import { Roles } from "../types/slices/authSliceTypes";
import { io } from "socket.io-client";
import { WS_URL } from "../constants";

export const Login: FC = () => {
    const navigation = useNavigation();
    const [loginEmail, setLoginEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const {setUserAuthData} = useAuthDispatchActions();
    const {postRequest} = useHttpRequest();
    const {setSocket} = useContext(SocketContext);
    
    const onSubmitLogin = async () => {
        /**
         * TODO: 
         *  -Add a loading state when submit.
         *  -Handle the errors
        */
        let body = {
            username: loginEmail,
            password: password
        };
        try {
            const response = await postRequest('auth/login', body);
            let data = {
                username: response.payload.username,
                email: response.payload.email,
                roles: response.payload.roles,
                access_token: response.access_token,
                refresh_token: response.refresh_token,
            }
            setUserAuthData(data);
            const socket = io(WS_URL, {
                auth: {
                    token: `Bearer ${response.access_token}`,
                }
            });
            socket.on('connect_error', (error) => {
                console.log('Error from socket.');
                throw error;
            });
            socket.on('connect', () => {
                // Socket connection established, update socket context.
                setSocket(socket);
                // Empty the email and password useStates.
                setLoginEmail('');
                setPassword('');
                // And then redirect to the respective home screen.
                if (response.payload.roles.includes(Roles.Taxi))
                    navigation.navigate('HomeStack', {screen: 'TaxiHome'});
                else
                    navigation.navigate('HomeStack', {screen: 'UserHome'});
            });
        } catch (error) {
            console.log(`error from catch: ${error}`);
        }
    }

    return (
        <View style={styles.homeContainer}>
            <View style={styles.rolsContainer}>
                <TextInput value={loginEmail} onChangeText={text => setLoginEmail(text)} style={styles.textInput}/>
                <TextInput secureTextEntry value={password} onChangeText={text => setPassword(text)} style={styles.textInput}/>
                <Button title="Login" onPress={onSubmitLogin}/>
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
    textInput: {
        minWidth: '80%',
        fontSize: 18,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: 'gray',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: 'black',
    },
    rolsContainer: {
      flex: 1,
      flexDirection: 'column',
      width: '100%',
      height: '10%',
      alignItems: 'center',
      justifyContent: 'center',
    },
});