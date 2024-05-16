import { BaseEntity } from "src/base-entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { CancellationReason } from "./CancellationReason.enum";

@Entity({name: 'rides'})
export class Ride extends BaseEntity {
    @Column({name: 'origin_lat', type: 'float8'})
    originLatitude: number;

    @Column({name: 'origin_lng', type: 'float8'})
    originLongitude: number;

    @Column({name: 'destination_lat', type: 'float8'})
    destinationLatitude: number;

    @Column({name: 'destination_lng', type: 'float8'})
    destinationLongitude: number;

    @Column({name: 'accepted_timestamp', type: 'timestamp without time zone'})
    acceptedTimestamp: Date;

    @Column({name: 'arrived_timestamp', type: 'timestamp without time zone', default: null, nullable: true})
    arrivedTimestamp: Date;

    @Column({name: 'finished_timestamp', type: 'timestamp without time zone', default: null, nullable: true})
    finishedTimestamp: Date;
    
    @ManyToOne(() => User, (user) => user.rides, {nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE'})
    @JoinColumn({name: 'user_id', referencedColumnName: 'id'})
    user: User;

    @ManyToOne(() => User, (user) => user.rides, {nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE'})
    @JoinColumn({name: 'driver_id', referencedColumnName: 'id'})
    driver: User;

    @Column({name: 'was_cancelled', default: false, nullable: false})
    wasCancelled: boolean;

    @Column({
        name: "cancellation_reason",
        type: "enum",
        enum: CancellationReason,
        nullable: true,
        default: null,
    })
    cancellationReason: CancellationReason;
}