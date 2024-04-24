import React, { FC } from 'react';
import AreYouSureModal from '../AreYouSureModal';
import { useLogOut } from 'hooks/useLogOut';

interface LogoutModalInterface {
  close: () => void;
}

const LogoutModal: FC<LogoutModalInterface> = ({ close }) => {
  const {logOut} = useLogOut();
  return <AreYouSureModal text="Estás seguro que quieres cerrar sesión?" onAccept={logOut} close={close} cardStyles={{ height: '50%' }} />;
};

export default LogoutModal;