import { Controller, Post, Body, Logger } from '@nestjs/common';
import { LandNFTService } from './land-nft.service';
import { CreateTokenDto, MintTokenDto } from './DTOS/create-token';

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
  async pauseLandToken(@Body() body: { tokenId: string }): Promise<string> {
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
}
