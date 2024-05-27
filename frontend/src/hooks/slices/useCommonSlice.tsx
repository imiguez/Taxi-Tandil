import { useDispatch, useSelector } from "react-redux";
import { selectError, selectErrorMessage,
    setError as setErrorFromCommonSlice,
    setErrorMessage,
    selectNotifications,
    setNotifications,
    selectPushNotificationsPermissionAlreadyRequested,
    setPushNotificationsPermissionAlreadyRequested as setPushNotificationsPermissionAlreadyRequestedFromCommonSlice
} from "../../../slices/commonSlice";
import { notificationKeyType } from "types/slices/commonSliceTypes";


export const useCommonSlice = () => {
    const dispatch = useDispatch();
    const error = useSelector(selectError);
    const errorMessage = useSelector(selectErrorMessage);
    const notifications = useSelector(selectNotifications);
    const pushNotificationsPermissionAlreadyRequested = useSelector(selectPushNotificationsPermissionAlreadyRequested);

    const setError = (message: string | undefined = undefined) => {
        dispatch(setErrorFromCommonSlice(true));
        dispatch(setErrorMessage(message));
    }

    const cleanError = () => {
        dispatch(setErrorFromCommonSlice(false));
        dispatch(setErrorMessage(undefined));
    }

    const addNotification = (type: notificationKeyType) => {
        dispatch(setNotifications({element: type, type: 'ADD'}));
    }

    const removeNotification = (type: notificationKeyType) => {
        dispatch(setNotifications({element: type, type: 'REMOVE'}));
    }

    const cleanUp = () => {
        dispatch(setErrorFromCommonSlice(false));
        dispatch(setErrorMessage(undefined));
        dispatch(setNotifications([]));
    }

    const setPushNotificationsPermissionAlreadyRequested = (requested: boolean) => {
        dispatch(setPushNotificationsPermissionAlreadyRequestedFromCommonSlice(requested));
    }

    return {
        error, errorMessage, setError, cleanError,
        notifications, addNotification, removeNotification, setPushNotificationsPermissionAlreadyRequested, pushNotificationsPermissionAlreadyRequested,
        cleanUp
    }
}