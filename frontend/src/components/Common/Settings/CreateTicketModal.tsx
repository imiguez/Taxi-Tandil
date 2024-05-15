import { Keyboard, StyleSheet, TextInput, View } from 'react-native'
import React, { FC, useEffect, useState } from 'react'
import AreYouSureModal from '../AreYouSureModal'
import { useAuthDispatchActions } from '@hooks/slices/useAuthDispatchActions';
import { useHttpRequest } from '@hooks/useHttpRequest';

interface CreateTicketModalInterface {
  close: () => void;
}
  
const CreateTicketModal: FC<CreateTicketModalInterface> = ({ close }) => {
    const { postRequest } = useHttpRequest();
    const { id } = useAuthDispatchActions();
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
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
      try {
        await postRequest(`tickets`, { issuer_id: id, title: title, description: description });
        close();
      } catch (error) {
        console.log(error);
      }
    }

    return (
    <AreYouSureModal
      text="Escriba un titulo resumiendo el problema que tuvo y luego describa detalladamente."
      onAccept={onAccept}
      close={close}
      cardStyles={{ height: expand ? '70%' : '50%' }}
    >
    <View style={styles.inputsContainer}>
      <TextInput
        placeholder="Título.."
        value={title}
        onChangeText={(text) => setTitle(text)}
        style={styles.inputs}
        keyboardType="default"
        inputMode="text"
        maxLength={50}
      />

    <TextInput
        placeholder="Descripción.."
        value={description}
        onChangeText={(text) => setDescription(text)}
        style={[styles.inputs, styles.descriptionInput]}
        keyboardType="default"
        inputMode="text"
        multiline
        maxLength={500} 
      />
      </View>
    </AreYouSureModal>
  )
}

export default CreateTicketModal


const styles = StyleSheet.create({
  card: {
    height: '50%',
    top: '10%',
  },
  inputsContainer: {
    flex: .8, 
    width: '100%', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    backgroundColor: 'white'
  },
  inputs: {
    minHeight: 30,
    maxHeight: 100,
    fontSize: 16,
    width: '80%',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'grey',
  },
  descriptionInput: {
    marginTop: 10,
    flexShrink: 1,
    flexWrap: 'wrap'
  }
});