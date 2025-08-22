import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/shared/entities/index';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

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
        user.password = await this.passwordHash(createUserDto.password);
        user.isAccSynced = false;
        user.createdAt = new Date();
        user.isAccSynced = false;

        const data = this.userRepository.create(user);
        return this.userRepository.save(data);
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto) {
        const userExists = await this.userRepository.findOne({ where: { userID: Number(id) } });
        if (!userExists) {
            throw new NotFoundException('User not found');
        }
        const user = new User();
        Object.assign(user, updateUserDto);
        user.modifiedAt = new Date();


        return this.userRepository.update(id, user);
    }

    async getUserById(id: number) {
        return this.userRepository.findOne({ where: { userID: Number(id) } });
    }

    async deleteUser(id: number) {
        const user = await this.userRepository.findOne({ where: { userID: Number(id) } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        user.deletedAt = new Date();
        return this.userRepository.save(user);
    }

    async getUsers() {
        return this.userRepository.find({
            select: [
                'userID',
                'firstName',
                'lastName',
                'email',
                'isAccSynced',
                'accUser',
            ],
            relations: ['accUser'],
        });
    }

    async findByEmail(email: string) {
        return this.userRepository.findOne({ where: { email } });
    }


    async getUserPasswordByUserId(userID: number, password: any): Promise<string> {
        let userData = await this.userRepository
          .findOne({
            where: { userID },
            select: ['password'],
          })
        let isValidPass = await this.passwordCheck(userData?.password || '', password);
        return userData?.password || '';
    }

    passwordHash(password: string): Promise<string> {
        return bcrypt.hash(password, 2).catch((err) => {
          throw new Error(err);
        });
      }

    async passwordCheck(password: string, passwordToCheck: string) {
        return await bcrypt.compare(passwordToCheck, password);
    }

    async updateTemporaryPassword(userID: number, password: string) {
        return this.userRepository.update(userID, {
          password: password,
        });
      }

    async userLoginObj(user: User) {
    const foundUser = await this.userRepository.findOne({
        where: {userID: user.userID},
        select: [
        'userID',
        'firstName',
        'lastName',
        'email',
        'isAccSynced',
        'createdAt',
        'modifiedAt',
        'deletedAt',
        ],
    });

    if (!foundUser) {
        throw new Error('User not found');
    }

    return {
        userID: foundUser.userID,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        email: foundUser.email,
        isAccSynced: foundUser.isAccSynced,
        createdAt: foundUser.createdAt,
        modifiedAt: foundUser.modifiedAt,
        deletedAt: foundUser.deletedAt,
    };
    }

    }

