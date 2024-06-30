import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableHighlight, View } from 'react-native';
import React, { useState } from 'react';
import { emptyInput, input } from 'types/Auth';
import { useHttpRequest } from '@hooks/useHttpRequest';
import { HttpError } from 'types/HttpRequests/Requests';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from 'types/RootStackParamList';

const EmailVerification = () => {
    const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const { postRequest } = useHttpRequest();
  const [formEmail, setFormEmail] = useState<input>(emptyInput);
  const [serverMsg, setServerMsg] = useState<string>('');

  const onSubmitVerification = async () => {
    if (formEmail.value == '') setFormEmail({ value: '', msg: 'Campo vacío', error: true });
    else if (!formEmail.value.includes('@')) setFormEmail({ ...formEmail, msg: 'No es un email válido', error: true });

    if (formEmail.value == '' || !formEmail.value.includes('@')) {
      setServerMsg('');
      return;
    }

    try {
      await postRequest(`auth/verify-account/${formEmail.value}`);
      setFormEmail(emptyInput);
    } catch (error: HttpError | any) {
      switch (error.statusCode) {
        case 404:
            setServerMsg('El email ingresado no fue registrado, debe crearse una cuenta para poder enviar un email de verificación.');
            break;
        case 409:
            setServerMsg('El email ingresado ya fue verificado.');
            break;
        default:
            setServerMsg('Error con el servidor, intente de nuevo. Si sigue ocurriendo puede ser una falla del servidor.');
            break;
      }
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS == 'android' ? 'height' : 'padding'}>
      <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
        <Text style={styles.infoText}>Recordá que el email de verificación tiene un tiempo de vida, es decir que pasados unos minutos, la verificación expira y ya no es válida. En dicho caso deberás reenviár un email de verificación.</Text>
        <TextInput
            placeholder="Email"
            maxLength={100}
            value={formEmail.value}
            onChangeText={(text) => setFormEmail({ ...formEmail, value: text, error: false })}
            style={[styles.textInput, formEmail.error ? { borderColor: 'red' } : {}]}
        />
        {formEmail.error && <Text style={styles.textInputMsg}>{formEmail.msg}</Text>}

        {serverMsg != '' && (
            <View style={styles.serverMsg}>
            <Text>{serverMsg}</Text>
            </View>
        )}

        <View style={styles.bar} />

        <TouchableHighlight style={[styles.btns, styles.resendBtn]} onPress={onSubmitVerification}>
            <Text style={styles.btnsText}>Reenviar</Text>
        </TouchableHighlight>

        <TouchableHighlight style={[styles.btns]} onPress={() => navigation.goBack()}>
            <Text style={[styles.btnsText, styles.goBackText]}>Volver atrás</Text>
        </TouchableHighlight>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EmailVerification;

const styles = StyleSheet.create({
keyboard: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
    backgroundColor: 'white',
},
infoText: {
    width: '80%',
    marginBottom: 20,
    marginTop: 50,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 10,
    padding: 15,
},
  textInput: {
    width: '80%',
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
  bar: {
    width: '80%',
    height: 1,
    backgroundColor: '#d9d9d9',
    marginVertical: 20,
  },
  btns: {
    width: '80%',
    paddingVertical: 10,
    borderRadius: 10,
    borderStyle: 'solid',
    borderWidth: 1,
  },
  btnsText: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  resendBtn: {
    backgroundColor: '#ffe700',
    borderColor: '#f9e200',
    marginBottom: 20
  },
  goBackText: {
    color: 'black',
    fontWeight: '500',
    fontSize: 16,
  },
});