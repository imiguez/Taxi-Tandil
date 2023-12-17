import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'rides'})
export class Ride {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'origen_lat', type: 'float8'})
    originLatitude: number;

    @Column({name: 'origen_lng', type: 'float8'})
    originLongitude: number;

    @Column({name: 'destination_lat', type: 'float8'})
    destinationLatitude: number;

    @Column({name: 'destination_lng', type: 'float8'})
    destinationLongitude: number;

    @Column({name: 'accepted_timestamp', type: 'timestamp without time zone'})
    acceptedTimestamp: Date;
    
    // Can be added a timestamp when driver arrives and finishes the ride.

    @ManyToOne(() => User, (user) => user.rides, {nullable: false})
    @JoinColumn({name: 'user_id', referencedColumnName: 'id'})
    user: User;

    @ManyToOne(() => User, (user) => user.rides, {nullable: false})
    @JoinColumn({name: 'driver_id', referencedColumnName: 'id'})
    driver: User;

    @Column({name: 'was_canceled', default: false, nullable: false})
    wasCanceled: boolean;
}