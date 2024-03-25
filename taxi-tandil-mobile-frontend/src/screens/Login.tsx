import { FC, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableHighlight, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useHttpRequest } from '../hooks/useHttpRequest';
import { useAuthDispatchActions } from '../hooks/useAuthDispatchActions';
import { input, emptyInput } from '../types/Auth';
import { initialAuthSliceStateType } from '../types/slices/authSliceTypes';
import { StackNavigationProp } from '@react-navigation/stack';
import RootStackParamList from '../types/RootStackParamList';

export const Login: FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [formEmail, setFormEmail] = useState<input>(emptyInput);
  const [formPassword, setFormPassword] = useState<input>(emptyInput);
  const [serverMsg, setServerMsg] = useState<string>('');
  const { setUserAuthData } = useAuthDispatchActions();
  const { postRequest } = useHttpRequest();

  const onSubmitLogin = async () => {
    /**
     * TODO:
     *  -Add a loading state when submit.
     *  -Handle the errors
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
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      };
      // Empty the email and password useStates.
      setFormEmail(emptyInput);
      setFormPassword(emptyInput);
      setServerMsg('');
      setUserAuthData(data);
      navigation.navigate('Main', { screen: 'Home', params: { screen: 'NewRide' } });
    } catch (error: any) {
      console.log(`error from catch: ${error}`);
      if (error.message.includes('Could not find any entity')) {
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