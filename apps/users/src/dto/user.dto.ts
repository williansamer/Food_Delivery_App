import { InputType, Field } from "@nestjs/graphql";
import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength } from "class-validator";

@InputType()
export class RegisterDto {
    @Field()
    @IsNotEmpty({message: "Name is required."})
    @IsString({message: "Name must need to be one string."})
    name: string;

    @Field()
    @IsNotEmpty({message: "Password is required."})
    @MinLength(8, {message: "Password must be at least 8 characters."})
    password: string;

    @Field()
    @IsNotEmpty({message: "Email is required."})
    @IsEmail({}, {message: "Email is invalid."})
    email: string;

    @Field()
    @IsNotEmpty({message: "Phone Number is required."})
    @IsNumber({}, {message: "Phone number is invalid."})
    phone_number: number;
}

@InputType()
export class ActivationDto {
    @Field()
    @IsNotEmpty({message: 'Token is required.'})
    @IsString({message: "Token must need to be a string."})
    activationToken: string;

    @Field()
    @IsNotEmpty({message: 'Code is required.'})
    @IsString({message: "Code must need to be a string."})
    activationCode: string;
}

@InputType()
export class LoginDto {
    @Field()
    @IsNotEmpty({message: "Email is required."})
    @IsEmail({}, {message: "Email is invalid."})
    email: string;

    @Field()
    @IsNotEmpty({message: "Password is required."})
    password: string;
}
