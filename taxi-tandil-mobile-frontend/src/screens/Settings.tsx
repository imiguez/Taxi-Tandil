import { FC } from "react";
import { Button, Linking, Text } from "react-native";
import { useExpoTaskManager } from "../hooks/useExpoTaskManager";

export const Settings: FC = () => {

    const {stopAllTaks} = useExpoTaskManager();

    return (
        <>
            <Text>Settings</Text>
            <Button title="Stop all background tasks" onPress={stopAllTaks}/>
            <Button title="go to settings" onPress={() => Linking.openSettings()}/>
        </>
    );
};