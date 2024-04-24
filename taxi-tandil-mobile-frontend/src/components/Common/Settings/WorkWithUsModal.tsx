import { Keyboard, StyleSheet, TextInput } from 'react-native';
import React, { FC, useEffect, useState } from 'react';
import AreYouSureModal from '../AreYouSureModal';
import { useAuthDispatchActions } from 'hooks/slices/useAuthDispatchActions';
import { useHttpRequest } from 'hooks/useHttpRequest';

interface WorkWithUsModalInterface {
  close: () => void;
}

const WorkWithUsModal: FC<WorkWithUsModalInterface> = ({ close }) => {
  const [phone, setPhone] = useState<string>('');
  const { putRequest } = useHttpRequest();
  const { id } = useAuthDispatchActions();
  const [expand, setExpand] = useState<boolean>(false);

  const onKeyboardShow = () => setExpand(true);
  const onKeyboardNotShow = () => setExpand(false);

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener('keyboardDidShow', onKeyboardShow);
    const keyboardNotShowListener = Keyboard.addListener('keyboardDidHide', onKeyboardNotShow);
    return () => {
      keyboardShowListener.remove();
      keyboardNotShowListener.remove();
    };
  }, []);

  const onAccept = async () => {
    if (phone.length < 8) return;
    try {
      await putRequest(`users/${id}`, { phone: phone });
      close();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AreYouSureModal
      text="La solicitud de trabajo con nostros es exclusiva para remiseros y taxistas. En caso de ser remisero o taxista y querer trabajar con nosotros, escriba su número de telefono y presione Aceptar."
      onAccept={onAccept}
      close={close}
      cardStyles={{ height: expand ? '70%' : '50%' }}
    >
      <TextInput
        placeholder="Telefono.."
        value={phone}
        onChangeText={(text) => setPhone(text)}
        style={styles.phoneInput}
        keyboardType="phone-pad"
        inputMode="tel"
        maxLength={20}
      ></TextInput>
    </AreYouSureModal>
  );
};

export default WorkWithUsModal;

const styles = StyleSheet.create({
  card: {
    height: '70%',
  },
  phoneInput: {
    minHeight: 30,
    fontSize: 16,
    width: '80%',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'grey',
  },
});
