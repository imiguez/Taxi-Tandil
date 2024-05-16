import { Column, Entity, ManyToMany } from "typeorm";
import { User } from "./user.entity";
import { BaseEntity } from "src/base-entity";

@Entity({name: 'roles'})
export class Role extends BaseEntity {
    @Column({ length: 25 })
    name: string;

    @ManyToMany(() => User, (user) => user.roles, {lazy: true, onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    users: User[];
}