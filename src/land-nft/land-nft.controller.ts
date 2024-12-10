import { Controller, Post, Body, Logger, Param, BadRequestException } from '@nestjs/common';
import { LandNFTService } from './land-nft.service';
import {
  CreateTokenDto,
  MintTokenDto,
  PauseTokenMetadataDto,
  TransferDataDto,
  UpdateTokenMetadataDto,
} from './DTOS/create-token';

@Controller('land-nft')
export class LandNftController {
  private readonly logger = new Logger(LandNftController.name);

  constructor(private readonly landNftService: LandNFTService) {}

  /**
   * Endpoint to register a new land token.
   */
  @Post('/registerLandToken')
  async registerLandToken(@Body() data: CreateTokenDto): Promise<string> {
    try {
      const tokenId = await this.landNftService.createLandToken(data);
      return `Token successfully registered with ID: ${tokenId}`;
    } catch (err) {
      this.logger.error('Error registering land token:', err);
      throw err;
    }
  }

  /**
   * Endpoint to mint metadata for a land token.
   * @param body - Request body containing tokenId and metadata array.
   */
  @Post('/mintLandToken')
  async mintLandToken(@Body() body: MintTokenDto): Promise<string> {
    try {
      const { tokenId } = body;
      const metadata = `${body.surveyNumber}, ${body.ownerName},${body.size} ${body.location}, ${body.landType}, ${body.additionalInfo}`;
      // const metadataBuffers = metadata.map((item) => Buffer.from(item));
      await this.landNftService.mintLandToken(tokenId, [Buffer.from(metadata)]);
      return `Metadata successfully minted for token ID: ${tokenId}`;
    } catch (err) {
      this.logger.error('Error minting land token metadata:', err);
      throw err;
    }
  }

  /**
   * Endpoint to pause a land token.
   * @param body - Request body containing the tokenId.
   */
  @Post('/pauseLandToken')
  async pauseLandToken(@Body() body: PauseTokenMetadataDto): Promise<string> {
    try {
      const { tokenId } = body;
      const result = await this.landNftService.pauseToken(tokenId);
      return result
        ? `Token with ID: ${tokenId} successfully paused.`
        : `Failed to pause token with ID: ${tokenId}.`;
    } catch (err) {
      this.logger.error('Error pausing land token:', err);
      throw err;
    }
  }

  /**
   * Update metadata for a specific land token (NFT)
   */
  @Post('/updateLandTokenMetadata')
  async updateTokenMetadata(
    @Body() body: UpdateTokenMetadataDto,
  ): Promise<string> {
    try {
      const { tokenId } = body;
      // Assuming metadata is passed as a string for simplicity, you can structure it as needed
      // const metadata = `${body.surveyNumber}, ${body.ownerName}, ${body.size} ${body.location}, ${body.landType}, ${body.additionalInfo}`;

      // Call the service method to update the token metadata
      await this.landNftService.updateTokenMetadata(tokenId);

      return `Metadata successfully updated for token ID: ${tokenId}`;
    } catch (err) {
      this.logger.error('Error updating land token metadata:', err);
      throw err;
    }
  }

  @Post('/transferLandToken/:tokenId')
  async transferLand(
    @Param('tokenId') tokenId: string,
    @Body() transferData: TransferDataDto, // Use the DTO here for validation
  ): Promise<string> {
    const { fromAccountId, toAccountId, serialNumber } = transferData;

    try {
      // Log the transfer request details
      this.logger.log(
        `Received transfer request for token ${tokenId} from ${fromAccountId} to ${toAccountId} with serial number ${serialNumber}`,
      );

      // Call the service method to handle the NFT transfer logic
      await this.landNftService.transferLand(
        tokenId,
        fromAccountId,
        toAccountId,
        serialNumber,
      );

      // Return success message
      return `Successfully initiated transfer of token ${tokenId} from ${fromAccountId} to ${toAccountId}.`;
    } catch (error) {
      this.logger.error('Error processing transfer request', error.stack);
      throw new BadRequestException('Transfer failed. Please try again later.');
    }
  }
}
