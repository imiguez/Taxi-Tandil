export interface RideInterface {
    id: number;
    taxi_username: string;
    origin_long_name: string,
    origin_lat: number,
    origin_lng: number,
    destination_long_name: string,
    destination_lat: number,
    destination_lng: number,
    created_at: Date;
    accepted_timestamp: Date;
    arrived_timestamp: Date | null;
    finished_timestamp: Date | null;
    was_cancelled: boolean | null;
    cancellation_reason: string | null;
}