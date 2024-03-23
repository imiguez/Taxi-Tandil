import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dtos/user-update.dto';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.usersRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { email: email })
      .getOneOrFail();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  async findById(id: number): Promise<User | null> {
    try {
      return await this.usersRepository
      .createQueryBuilder("user")
      .where("user.id = :id", { id: id })
      .getOneOrFail();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
  
  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async updateById(id: number, userDto: UpdateUserDto) {
    try {
      const result = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set(userDto)
      .where("id = :id", { id: id })
      .returning(['firstName', 'lastName', 'phoneNumber'])
      .execute();
      return result.generatedMaps[0];
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}