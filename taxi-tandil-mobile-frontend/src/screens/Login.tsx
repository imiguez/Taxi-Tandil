import { FC, useContext, useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SocketContext } from "../hooks/useSocketContext";
import { useHttpRequest } from "../hooks/useHttpRequest";
import { useAuthDispatchActions } from "../hooks/useAuthDispatchActions";
import { Roles } from "../types/slices/authSliceTypes";
import { LoginResponseType } from "../types/HttpRequests/Auth";

export const Login: FC = () => {
    const navigation = useNavigation();
    const socket = useContext(SocketContext);
    const [loginEmail, setLoginEmail] = useState<String>('');
    const [password, setPassword] = useState<String>('');
    const {username, email, roles, accessToken, refreshToken, setUserAuthData} = useAuthDispatchActions();
    const {postRequest} = useHttpRequest();
    
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
            const response: LoginResponseType = await postRequest('auth/login', body);
            let data = {
                username: response.payload.username,
                email: response.payload.email,
                roles: response.payload.roles,
                access_token: response.access_token,
                refresh_token: response.refresh_token,
            }
            setUserAuthData(data);
            if (response.payload.roles.includes(Roles.Taxi))
                navigation.navigate('HomeStack', {screen: 'TaxiHome'});
            else
                navigation.navigate('HomeStack', {screen: 'UserHome'});
        } catch (error) {

        }
    }

    return (
        <View style={styles.homeContainer}>
            <View style={styles.rolsContainer}>
                <TextInput onChangeText={text => setLoginEmail(text)} style={styles.textInput}/>
                <TextInput secureTextEntry onChangeText={text => setPassword(text)} style={styles.textInput}/>
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