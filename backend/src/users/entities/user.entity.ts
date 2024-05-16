import { Column, Entity, JoinTable, ManyToMany, OneToMany } from "typeorm";
import { Role } from "./role.entity";
import { Ride } from "src/rides/entities/ride.entity";
import { BaseEntity } from "src/base-entity";
import { Ticket } from "src/ticket/entities/ticket.entity";

@Entity({name: 'users'})
export class User extends BaseEntity {
    @Column({ name: 'first_name', length: 25 })
    firstName: string;
  
    @Column({ name: 'last_name', length: 25 })
    lastName: string;
  
    @Column({ length: 200, unique: true })
    email: string;

    @Column({ select: false })
    password: string;

    @Column({ name: 'phone_number', length: 20, nullable: true })
    phoneNumber: string;

    @ManyToMany(() => Role, (role) => role.users, {eager: true, onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    @JoinTable({name: 'users_roles'})
    roles: Role[];

    @OneToMany(() => Ride, ride => ride.user, {lazy: true})
    @OneToMany(() => Ride, ride => ride.driver, {lazy: true})
    rides: Ride[];

    @OneToMany(() => Ticket, ticket => ticket.issuer, {lazy: true})
    tickets: Ticket[];
}