import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTokenDto {
  @ApiProperty({
    example: 'Land Parcel Token',
    description: 'The name of the token',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @Length(3, 50, {
    message: 'Token name must be between 3 and 50 characters long.',
  })
  tokenName: string;

  @ApiProperty({
    example: 'LAND',
    description: 'The symbol of the token',
    minLength: 1,
    maxLength: 10,
  })
  @IsString()
  @Length(1, 10, {
    message: 'Token symbol must be between 1 and 10 characters long.',
  })
  tokenSymbol: string;
}

export class MintTokenDto {
  @ApiProperty({
    example: '123456',
    description: 'The unique identifier for the token',
  })
  @IsString()
  tokenId: string;

  @ApiProperty({
    example: '12345',
    description: 'The survey number of the land',
  })
  @IsString()
  surveyNumber: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the owner',
  })
  @IsString()
  ownerName: string;

  @ApiProperty({
    example: 'Village ABC, District XYZ',
    description: 'The location of the land',
  })
  @IsString()
  location: string;

  @ApiProperty({
    example: '5 Acres',
    description: 'The size of the land',
  })
  @IsString()
  size: string;

  @ApiProperty({
    example: 'Agricultural',
    description: 'The type of the land',
  })
  @IsString()
  landType: string;

  @ApiProperty({
    example: 'Certified organic land',
    description: 'Additional information about the land',
  })
  @IsString()
  additionalInfo: string;
}

// Example data for token DTO
export const exampleTokenData = {
  tokenName: 'MyToken',
  tokenSymbol: 'MTK',
};

export const exampleMintTokenData = {
  tokenId: '123456',
  surveyNumber: '12345',
  ownerName: 'John Doe',
  location: 'Village ABC, District XYZ',
  size: '5 Acres',
  landType: 'Agricultural',
  additionalInfo: 'Certified organic land',
};

export class UpdateTokenMetadataDto {
  @ApiProperty({
    example: '123456',
    description: 'The unique identifier for the token',
  })
  @IsString()
  tokenId: string;
}

export class PauseTokenMetadataDto {
  @ApiProperty({
    example: '123456',
    description: 'The unique identifier for the token',
  })
  @IsString()
  tokenId: string;
}

export class TransferDataDto {
  @ApiProperty({
    description: 'The ID of the account transferring the NFT',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  fromAccountId: string;

  @ApiProperty({
    description: 'The ID of the account receiving the NFT',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  toAccountId: string;

  @ApiProperty({
    description: 'The serial number of the NFT being transferred',
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  serialNumber: number;
}
