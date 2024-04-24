import { useDispatch, useSelector } from "react-redux";
import { selectError, selectErrorMessage,
    setError as setErrorFromCommonSlice,
    setErrorMessage,
    selectNotifications,
    setNotifications as setNotificationFromCommonSlice,
} from "../../../slices/commonSlice";
import { notificationKeyType } from "types/slices/commonSliceTypes";


export const useCommonSlice = () => {
    const dispatch = useDispatch();
    const error = useSelector(selectError);
    const errorMessage = useSelector(selectErrorMessage);
    const notifications = useSelector(selectNotifications);

    const setError = (message: string | undefined = undefined) => {
        dispatch(setErrorFromCommonSlice(true));
        dispatch(setErrorMessage(message));
    }

    const cleanError = () => {
        dispatch(setErrorFromCommonSlice(false));
        dispatch(setErrorMessage(undefined));
    }

    const addNotification = (type: notificationKeyType) => {
        let n: notificationKeyType[] | undefined;
        if (notifications != undefined) {
            n = [...notifications];
            n.unshift(type);
        } else
            n = [type];
        dispatch(setNotificationFromCommonSlice(n));
    }

    const removeNotification = (type: notificationKeyType) => {
        let n: notificationKeyType[] | undefined;
        if (notifications != undefined) {
            let i = notifications.indexOf(type);
            if (i > -1) {
                n = [...notifications];
                n.splice(i, 1);
                dispatch(setNotificationFromCommonSlice(n));
            }
        }
    }

    const cleanUp = () => {
        dispatch(setErrorFromCommonSlice(false));
        dispatch(setErrorMessage(undefined));
        dispatch(setNotificationFromCommonSlice(undefined));
    }

    return {
        error, errorMessage, setError, cleanError,
        notifications, addNotification, removeNotification,
        cleanUp
    }
}