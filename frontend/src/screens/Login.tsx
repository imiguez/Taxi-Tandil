import { FC, useContext, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableHighlight, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthDispatchActions } from "hooks/slices/useAuthDispatchActions";
import { useHttpRequest } from 'hooks/useHttpRequest';
import { input, emptyInput } from 'types/Auth';
import { initialAuthSliceStateType } from 'types/slices/authSliceTypes';
import { SessionContext } from '@hooks/useSessionContext';
import { AuthStackParamList } from 'types/RootStackParamList';
import * as SecureStore from 'expo-secure-store';
import { OneSignal } from 'react-native-onesignal';

export const Login: FC = () => {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const { setIsLogged } = useContext(SessionContext)!;
  const [formEmail, setFormEmail] = useState<input>(emptyInput);
  const [formPassword, setFormPassword] = useState<input>(emptyInput);
  const [serverMsg, setServerMsg] = useState<string>('');
  const { setUserAuthData, storeAuthentication, setAccessToken, setRefreshToken } = useAuthDispatchActions();
  const { postRequest } = useHttpRequest();

  const onSubmitLogin = async () => {
    /**
     * TODO:
     *  -Add a loading state when submit.
     */
    if (formEmail.value == '') setFormEmail({...formEmail, msg: 'Campo vacío', error: true});
    if (formPassword.value == '') setFormPassword({...formPassword, msg: 'Campo vacío', error: true});
    
    if (formEmail.value == '' || formPassword.value == '') {
      setServerMsg('');
      return;
    }

    setServerMsg('');

    let body = {
      email: formEmail.value,
      password: formPassword.value,
    };

    try {
      const response = await postRequest('auth/login', body);
      let data: initialAuthSliceStateType = {
        id: response.user.id,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        email: response.user.email,
        roles: response.user.roles,
      };
      // OneSignal login and attempts to get the subscription id.
      data.id ? OneSignal.login(data.id): '';
      let i = 0;
      let id = await OneSignal.User.pushSubscription.getIdAsync();
      let interval = setInterval(async () => {
        i++;
        if (id || i >= 20) {
          if (id) await SecureStore.setItemAsync('push_sub_id', id);
          clearInterval(interval);
          return;
        } 
        id = await OneSignal.User.pushSubscription.getIdAsync();
      }, 1000)
      // Empty the email and password useStates.
      setFormEmail(emptyInput);
      setFormPassword(emptyInput);
      setServerMsg('');
      // Set user authentication data into redux and into the SecureStore.
      setUserAuthData(data);
      await setAccessToken(response.access_token);
      await setRefreshToken(response.refresh_token);
      storeAuthentication(data);
      setIsLogged(true);
    } catch (error: any) {
      if (process.env.ENVIRONMENT === 'dev') console.log(`error from catch: ${error}`);
      if (error.statusCode === 404) {
        setFormEmail({...formEmail, msg: 'No existe usuario con el email ingresado', error: true});
        return;
      }
      if (error.message.includes('email must be an email')) {
        setFormEmail({...formEmail, msg: 'Email inválido', error: true});
        return;
      }
      if (error.message.includes('Incorrect password')) {
        setFormPassword({...formPassword, msg: 'Contraseña incorrecta', error: true});
        return;
      }
      setServerMsg(`Error con el servidor, intente de nuevo. Si sigue ocurriendo puede ser una falla del servidor.`);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS == 'android' ? 'height' : 'padding'}>
      <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
        <TextInput placeholder="Email" value={formEmail.value}
         onChangeText={(text) => setFormEmail({...formEmail, value: text, error: false})} 
         style={[styles.textInput, formEmail.error ? { borderColor: 'red' } : {}]} />
        {formEmail.error && <Text style={styles.textInputMsg}>{formEmail.msg}</Text>}

        <TextInput
          placeholder="Contraseña"
          secureTextEntry
          value={formPassword.value}
          onChangeText={(text) => setFormPassword({...formPassword, value: text, error: false})}
          style={[styles.textInput, formPassword.error ? { borderColor: 'red' } : {}]}
        />
        {formPassword.error && <Text style={styles.textInputMsg}>{formPassword.msg}</Text>}

        <Text style={styles.link}>Olvidaste la contraseña?</Text>

        {serverMsg != '' && (
          <View style={styles.serverMsg}>
            <Text>{serverMsg}</Text>
          </View>
        )}

        <View style={styles.bar} />

        <TouchableHighlight style={styles.loginBtn} onPress={onSubmitLogin}>
          <Text style={styles.loginText}>Iniciar sesión</Text>
        </TouchableHighlight>

        <View style={styles.optionsContainer}>
          <Text style={styles.optionsText}>
            No tenés una cuenta?
            <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>
              {' '}
              Registrate aquí.
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    paddingTop: 60 * 3,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  textInput: {
    width: '80%',
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
  textInputMsg: {
    width: '80%',
    paddingHorizontal: 5,
    color: 'red',
  },
  serverMsg: {
    width: '80%',
    marginTop: 10,
    borderColor: 'red',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#f0386170',
  },
  link: {
    color: '#1877f2',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 15,
  },
  bar: {
    width: '80%',
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
    fontWeight: '700',
  },
  optionsContainer: {
    marginTop: 25,
  },
  optionsText: {
    paddingVertical: 25,
  },
});