import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/shared/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}


    async createUser(createUserDto: CreateUserDto) {

        const user = new User();
        user.firstName = createUserDto.firstName;
        user.lastName = createUserDto.lastName;
        user.email = createUserDto.email;
        user.password = createUserDto.password;
        user.isAccSynced = false;
        user.createdAt = new Date();
        user.isAccSynced = false;

        const data = this.userRepository.create(user);
        return this.userRepository.save(data);
    }

    async updateUser(id: string, updateUserDto: UpdateUserDto) {
        const userExists = await this.userRepository.findOne({ where: { userID: Number(id) } });
        if (!userExists) {
            throw new NotFoundException('User not found');
        }
        const user = new User();
        Object.assign(user, updateUserDto);
        user.modifiedAt = new Date();


        return this.userRepository.update(id, user);
    }

    async getUser(id: string) {
        return this.userRepository.findOne({ where: { userID: Number(id) } });
    }

    async deleteUser(id: string) {
        const user = await this.userRepository.findOne({ where: { userID: Number(id) } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        user.deletedAt = new Date();
        return this.userRepository.save(user);
    }

    async getUsers() {
        return this.userRepository.find();
    }

    async findByEmail(email: string) {
        return this.userRepository.findOne({ where: { email } });
    }



}