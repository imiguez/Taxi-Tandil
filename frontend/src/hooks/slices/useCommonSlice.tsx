import { useDispatch, useSelector } from "react-redux";
import { selectError, selectErrorMessage,
    setError as setErrorFromCommonSlice,
    setErrorMessage,
    selectNotifications,
    setNotifications,
} from "../../../slices/commonSlice";
import { notificationKeyType } from "types/slices/commonSliceTypes";
import { useMemo, useRef } from "react";


export const useCommonSlice = () => {
    const dispatch = useDispatch();
    const error = useSelector(selectError);
    const errorMessage = useSelector(selectErrorMessage);
    const notifications = useSelector(selectNotifications);
    const notifiactionsRef = useRef(notifications);

    // Need an external ref pointing to 'notifications' to know when its updated because when 'notifications'
    // is updated, the 'notifications' variable in the addNotifications/removeNotifications scope its notifiactionsRef updated.
    useMemo(() => {
        notifiactionsRef.current = notifications;
    }, [notifications]);

    const setError = (message: string | undefined = undefined) => {
        dispatch(setErrorFromCommonSlice(true));
        dispatch(setErrorMessage(message));
    }

    const cleanError = () => {
        dispatch(setErrorFromCommonSlice(false));
        dispatch(setErrorMessage(undefined));
    }

    const addNotification = (type: notificationKeyType) => {
        let newNotifiactions: notificationKeyType[] = [];
        if (notifiactionsRef.current.length === 0) {
            newNotifiactions = [type];
        } else if (notifiactionsRef.current.find(notification => notification === type) === undefined) {
            newNotifiactions = [...notifiactionsRef.current, type];
        }
        dispatch(setNotifications(newNotifiactions));
    }

    const removeNotification = (type: notificationKeyType) => {
        let newNotifiactions: notificationKeyType[] = [];
        if (notifiactionsRef.current.length > 0) {
            newNotifiactions = [...notifiactionsRef.current];
            let i = newNotifiactions.indexOf(type);
            if (i > -1) {
                newNotifiactions.splice(i, 1);
                dispatch(setNotifications(newNotifiactions));
            }
        }
    }

    const cleanUp = () => {
        dispatch(setErrorFromCommonSlice(false));
        dispatch(setErrorMessage(undefined));
        dispatch(setNotifications(undefined));
    }

    return {
        error, errorMessage, setError, cleanError,
        notifications, addNotification, removeNotification,
        cleanUp
    }
}