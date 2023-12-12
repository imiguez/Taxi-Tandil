import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity({name: 'roles'})
export class Role {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ length: 25 })
    name: string;

    @ManyToMany(() => User, (user) => user.roles)
    users: User[];
}