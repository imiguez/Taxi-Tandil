import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.entity";
import { Ride } from "src/rides/entities/ride.entity";

@Entity({name: 'users'})
export class User {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ length: 25 })
    firstName: string;
  
    @Column({ length: 25 })
    lastName: string;
  
    @Column({ length: 200, unique: true })
    email: string;

    @Column()
    password?: string;

    @ManyToMany(() => Role, (role) => role.users, {eager: true})
    @JoinTable({name: 'users_roles'})
    roles: Role[];

    @OneToMany(() => Ride, 
    ride => {
        inversedBy: [
            ride.user,
            ride.driver,
        ]
    },
    {lazy: true})
    rides: Ride[];
}