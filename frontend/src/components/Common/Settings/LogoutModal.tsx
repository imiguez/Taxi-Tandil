import React, { FC } from 'react';
import AreYouSureModal from '../AreYouSureModal';
import { useLogOut } from 'hooks/useLogOut';
import { useHttpRequest } from '@hooks/useHttpRequest';

interface LogoutModalInterface {
  close: () => void;
}

const LogoutModal: FC<LogoutModalInterface> = ({ close }) => {
  const { getRequest } = useHttpRequest();
  const {logOut} = useLogOut();

  const handleOnAccept = async () => {
    await getRequest('auth/logout');
    await logOut();
  }

  return <AreYouSureModal text="Estás seguro que quieres cerrar sesión?" onAccept={handleOnAccept} close={close} cardStyles={{ height: '50%' }} />;
};

export default LogoutModal;