import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { ActivationDto, LoginDto, RegisterDto } from './dto/user.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { Response } from 'express';
import { hashSync } from 'bcrypt';
import { EmailService } from './email/email.service';

interface IUserData {
  name: string;
  email: string;
  password: string;
  phone_number: number;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // Register User Service
  async register(registerDto: RegisterDto, response: Response) {
    const { name, email, password, phone_number } = registerDto;
    const emailExists = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (emailExists) {
      throw new BadRequestException('User already exists with this email.');
    }

    const phoneNumberExists = await this.prisma.user.findUnique({
      where: {
        phone_number,
      },
    });

    if (phoneNumberExists) {
      throw new BadRequestException('This phone number already exists.');
    }

    const hashPassword = await hashSync(password, 10);

    const user = {
        name,
        email,
        password: hashPassword,
        phone_number
      }

      const activationToken = await this.createActivationToken(user);

      const activationCode = activationToken.activationCode;

      await this.emailService.sendMail({
        email,
        subject: "Activate your account!",
        template: "./activation-mail",
        name,
        activationCode
      })

    return { 
      activationToken, 
      response 
    };
  }

  //Create Activation Token
  async createActivationToken(user: IUserData) {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const activationToken = await this.jwtService.sign(
      {
        user,
        activationCode,
      },
      {
        secret: this.configService.get('ACTIVATION_SECRET'),
        expiresIn: '5m',
      },
    );

    return {activationToken, activationCode};
  }

  // Activating User
  async activateUser(activationDto: ActivationDto, response: Response) {
    const {activationToken, activationCode} = activationDto;

    const newUser: {user: IUserData, activationCode: string} = await this.jwtService.verify(
      activationToken,
      { secret: this.configService.get<string>('ACTIVATION_SECRET') } as JwtVerifyOptions
    ) as {user: IUserData, activationCode: string}

    if (newUser.activationCode !== activationCode) {
      throw new BadRequestException('Invalid activation code.');
    }

    const {name, email, password, phone_number} = newUser.user;

    const emailExists = await this.prisma.user.findUnique({
      where: {
        email,
      }
    })

    if (emailExists) {
      throw new BadRequestException('Email already exists.');
    }

    const phoneExists = await this.prisma.user.findUnique({
      where: {
        phone_number,
      }
    })

    if (phoneExists) {
      throw new BadRequestException('Phone number already exists.');
    }

    const hashedPassword = await hashSync(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone_number
      }
    });

    return { user, response };
  }

  //Login Service
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = {
      email,
      password,
    };

    return user;
  }

  // Get All Users Service
  async getUsers() {
    return await this.prisma.user.findMany({});
  }
}
