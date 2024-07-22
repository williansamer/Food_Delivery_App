import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { ActivationResponse, RegisterResponse } from './types/user.types';
import { ActivationDto, RegisterDto } from './dto/user.dto';
import { BadRequestException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Response } from 'express';

@Resolver('User')
export class UsersResolver {
  constructor(private readonly userService: UsersService) {}

  @Mutation(() => RegisterResponse)
  async register(
    @Args('registerDto') registerDto: RegisterDto,
    @Context() context: {res: Response}
  ): Promise<RegisterResponse> {
    if (!registerDto.name || !registerDto.email || !registerDto.password || !registerDto.phone_number) {
      throw new BadRequestException('Please fill all the fields.');
    }

    const { activationToken } = await this.userService.register(registerDto, context.res);

    return activationToken
  }

  @Mutation(() => ActivationResponse)
  async activateUser(
    @Args('activationDto') activationDto: ActivationDto,
    @Context() context: {res: Response},
  ): Promise<ActivationResponse> {
    return await this.userService.activateUser(activationDto, context.res);
  }

  @Query(() => [User] )
  async getUsers() {
    return await this.userService.getUsers();
  }
}
