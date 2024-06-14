import { Image } from 'react-native';
import React, { FC, useEffect, useState } from 'react';
import { useAuthDispatchActions } from '@hooks/slices/useAuthDispatchActions';
import { AuthRoutes, MainScreenTabs } from 'Routes';
import { SessionContext } from '@hooks/useSessionContext';

const SessionHandler: FC = () => {
  const [splashLoading, isSplashLoading] = useState<boolean>(true);
  const [isLogged, setIsLogged] = useState<boolean | undefined>(undefined);
  const { sessionCheck } = useAuthDispatchActions();

  const handleSessionCheck = async () => {
    let isLogged = await sessionCheck();
    setIsLogged(isLogged);
    isSplashLoading(false);
  };
  
  useEffect(() => {
    handleSessionCheck();
  }, []);
    
  return (
    <SessionContext.Provider value={{setIsLogged}}>
      {splashLoading ? <Image source={require('@public/assets/splash.png')} style={{ flex: 1, width: '100%', backgroundColor: '#ffcf00' }} /> 
      : 
        (isLogged ? <MainScreenTabs /> 
          : <AuthRoutes />
        )
      }
    </SessionContext.Provider>
  );
};

export default SessionHandler;