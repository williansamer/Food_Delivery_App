import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { ActivationDto, LoginDto, RegisterDto } from './dto/user.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { Response } from 'express';
import { compare, hashSync } from 'bcrypt';
import { EmailService } from './email/email.service';
import { TokenSender } from './utils/sendToken';

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

    const {name, email, password, phone_number} = newUser.user; // Não precisa encriptar o password porque no 'register' já foi encriptado e gerado/adicionado no token

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password,
        phone_number
      }
    });

    return { user, response };
  }

  //Login Service
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: {
        email
      }
    });

    if (user && await this.comparePassword(password, user.password)) {
      const tokenSender = new TokenSender(this.configService, this.jwtService);

      return tokenSender.sendToken(user);
    } else {
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        error: {
          message: 'Invalid email or password'
        }
      }
    }
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await compare(password, hashedPassword);
  }

  // Get All Users Service
  async getUsers() {
    return await this.prisma.user.findMany({});
  }
}
