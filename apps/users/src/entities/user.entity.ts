import { ObjectType, Field, Directive } from "@nestjs/graphql";

@ObjectType()
@Directive('@key(fields: "id")')
export class Avatars {
    @Field()
    id: string;

    @Field()
    public_id: string;

    @Field()
    url: string;

    @Field()
    userId: string;
}

@ObjectType()
export class User {
    @Field()
    id: string;

    @Field()
    name: string;

    @Field()
    email: string;

    @Field()
    password: string;

    @Field({nullable: true})
    phone_number?: string;

    @Field({nullable: true})
    address?: string;

    @Field(()=> Avatars, {nullable: true})
    avatar?: Avatars | null;

    @Field()
    created_at: Date;

    @Field()
    updated_at: Date;
}