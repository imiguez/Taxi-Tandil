import { Session, UserSocketData, UserToSerialize } from "src/types/serializer.type";

export class Serializer {

    public static serializeUser(user: UserToSerialize) {
        return JSON.stringify(user);
    }
    

    public static serializeSession(session: Session): string {
        return JSON.stringify(session);
    }

    public static deserializeSession(session: string): Session {
        return JSON.parse(session);
    }

    public static serializeUserSocketData(userData: UserSocketData): string {
        return JSON.stringify(userData);
    }

    public static deserializeUserSocketData(userData: string): UserSocketData {
        return JSON.parse(userData);
    }
}