import { BaseEntity } from "src/base-entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

@Entity({name: 'tickets'})
export class Ticket extends BaseEntity {

    @Column({ name: 'active', default: true, nullable: false })
    active: boolean;

    @Column({ name: 'title', length: 50 })
    title: string;

    @Column({ name: 'description', length: 500 })
    description: string;

    @ManyToOne(() => User, (user) => user.tickets, {nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE'})
    @JoinColumn({name: 'issuer_id', referencedColumnName: 'id'})
    issuer: User;
}