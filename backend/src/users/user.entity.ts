import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.entity";

@Entity({name: 'users'})
export class User {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ length: 25 })
    firstName: string;
  
    @Column({ length: 25 })
    lastName: string;
  
    @Column({ length: 100 })
    email: string;

    @Column()
    password?: string;

    @ManyToMany(() => Role, (role) => role.users)
    @JoinTable({name: 'users_roles'})
    roles: Role[];
}