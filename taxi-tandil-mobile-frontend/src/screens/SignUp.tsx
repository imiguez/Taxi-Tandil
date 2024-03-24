import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableHighlight, View } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useHttpRequest } from '../hooks/useHttpRequest';
import { useAuthDispatchActions } from '../hooks/useAuthDispatchActions';
import { input, emptyInput } from '../types/Auth';

export const SignUp = () => {
  const navigation = useNavigation();
  const [formFirstName, setFormFirstName] = useState<input>(emptyInput);
  const [formLastName, setFormLastName] = useState<input>(emptyInput);
  const [formEmail, setFormEmail] = useState<input>(emptyInput);
  const [formPassword, setFormPassword] = useState<input>(emptyInput);
  const [formConfirmPassword, setFormConfirmPassword] = useState<input>(emptyInput);
  const { setUserAuthData } = useAuthDispatchActions();
  const { postRequest } = useHttpRequest();
  const [serverMsg, setServerMsg] = useState<string>('');

  const onSubmitSignUp = async () => {
    /**
     * TODO:
     *  -Add a loading state when submit.
     */
    if (formFirstName.value == '') setFormFirstName({ value: '', msg: 'Campo vacío', error: true });
    if (formLastName.value == '') setFormLastName({ value: '', msg: 'Campo vacío', error: true });
    if (formEmail.value == '') setFormEmail({ value: '', msg: 'Campo vacío', error: true });
    else if (!formEmail.value.includes('@')) setFormEmail({ ...formEmail, msg: 'No es un email válido', error: true });
    if (formPassword.value == '') setFormPassword({ value: '', msg: 'Campo vacío', error: true });
    if (formConfirmPassword.value == '') setFormConfirmPassword({ value: '', msg: 'Campo vacío', error: true });
    if (formPassword.value != formConfirmPassword.value)
      setFormConfirmPassword({ ...formConfirmPassword, msg: 'Las contraseñas no son iguales', error: true });

    if (
      formFirstName.value == '' ||
      formLastName.value == '' ||
      formEmail.value == '' ||
      !formEmail.value.includes('@') ||
      formPassword.value == '' ||
      formConfirmPassword.value == '' ||
      formPassword.value != formConfirmPassword.value
    ) {
      setServerMsg('');
      return;
    }

    let body = {
      firstName: formFirstName.value,
      lastName: formLastName.value,
      email: formEmail.value,
      password: formPassword.value,
    };
    try {
      const response = await postRequest('auth/sign-up', body);
      let data = {
        id: response.user.id,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        email: response.user.email,
        roles: response.user.roles,
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      };
      // Empty the useStates.
      setFormFirstName(emptyInput);
      setFormLastName(emptyInput);
      setFormEmail(emptyInput);
      setFormPassword(emptyInput);
      setFormConfirmPassword(emptyInput);
      setServerMsg('');
      setUserAuthData(data);
      navigation.navigate('Main', { screen: 'Home', params: { screen: 'NewRide' } });
    } catch (error: any) {
      console.log(`error from catch: ${error}`);
      if (error.message.includes('duplicate key value')) {
        setFormEmail({...formEmail, msg: 'El email ingresado ya fue registrado', error: true});
        return;
      }
      if (error.message.includes('email must be an email')) {
        setFormEmail({...formEmail, msg: 'Email inválido', error: true});
        return;
      }
      setServerMsg('Error con el servidor, intente de nuevo. Si sigue ocurriendo puede ser una falla del servidor.');
    }
  };

  const checkPassword = (text: string) => {
    let msg = '';
    if (text.length < 8) msg = 'La contraseña debe ser de al menos 8 caracteres';
    else if (text.toLowerCase() === text) msg = 'La contraseña debe tener al menos 1 mayúscula';
    else if (text.toUpperCase() === text) msg = 'La contraseña debe tener al menos 1 minúscula';
    else if (!/\d/.test(text)) msg = 'La contraseña debe tener al menos 1 numero';
    else msg = '';

    setFormPassword({ msg: msg, value: text, error: msg != '' });
  };

  return (
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS == 'android' ? 'height' : 'padding'}>
      <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
        <TextInput
          placeholder="Nombre"
          maxLength={25}
          value={formFirstName.value}
          onChangeText={(text) => setFormFirstName({ ...formFirstName, value: text, error: false })}
          style={[styles.textInput, formFirstName.error ? { borderColor: 'red' } : {}]}
        />
        {formFirstName.error && <Text style={styles.textInputMsg}>{formFirstName.msg}</Text>}

        <TextInput
          placeholder="Apellido"
          maxLength={25}
          value={formLastName.value}
          onChangeText={(text) => setFormLastName({ ...formLastName, value: text, error: false })}
          style={[styles.textInput, formLastName.error ? { borderColor: 'red' } : {}]}
        />
        {formLastName.error && <Text style={styles.textInputMsg}>{formLastName.msg}</Text>}

        <TextInput
          placeholder="Email"
          maxLength={100}
          value={formEmail.value}
          onChangeText={(text) => setFormEmail({ ...formEmail, value: text, error: false })}
          style={[styles.textInput, formEmail.error ? { borderColor: 'red' } : {}]}
        />
        {formEmail.error && <Text style={styles.textInputMsg}>{formEmail.msg}</Text>}

        <TextInput
          placeholder="Contraseña"
          secureTextEntry
          value={formPassword.value}
          onChangeText={(text) => checkPassword(text)}
          style={[styles.textInput, formPassword.error ? { borderColor: 'red' } : {}]}
        />
        {formPassword.error && <Text style={styles.textInputMsg}>{formPassword.msg}</Text>}

        <TextInput
          placeholder="Confirme contraseña"
          secureTextEntry
          value={formConfirmPassword.value}
          onChangeText={(text) => setFormConfirmPassword({ ...formConfirmPassword, value: text, error: false })}
          style={[styles.textInput, formConfirmPassword.error ? { borderColor: 'red' } : {}]}
        />
        {formConfirmPassword.error && <Text style={styles.textInputMsg}>{formConfirmPassword.msg}</Text>}

        {serverMsg != '' && (
          <View style={styles.serverMsg}>
            <Text>{serverMsg}</Text>
          </View>
        )}

        <View style={styles.bar} />

        <TouchableHighlight style={styles.signUpBtn} onPress={onSubmitSignUp}>
          <Text style={styles.signUpText}>Registrarse</Text>
        </TouchableHighlight>

        <View style={styles.optionsContainer}>
          <Text style={styles.optionsText}>
            Ya tenés una cuenta?
            <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
              {' '}
              Inicia sesión aquí.
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
    paddingTop: 50,
    alignItems: 'center',
    backgroundColor: 'white',
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
    fontWeight: '700',
  },
  optionsContainer: {
    marginTop: 25,
  },
  optionsText: {
    paddingVertical: 25,
  },
});