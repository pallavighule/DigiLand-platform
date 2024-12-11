import { Injectable, Logger } from '@nestjs/common';
import {
  AccountId,
  PrivateKey,
  Client,
  TokenCreateTransaction,
  TokenType,
  Hbar,
  TokenMintTransaction,
  TokenSupplyType,
  TokenPauseTransaction,
} from '@hashgraph/sdk';
import { CreateTokenDto } from './DTOS/create-token';
import { PinataSDK, PinResponse } from 'pinata-web3';
import { v4 as uuidv4 } from 'uuid';
import { File } from 'formdata-node';

@Injectable()
export class LandNFTService {
  private readonly logger = new Logger(LandNFTService.name);
  private readonly client: Client;
  private readonly operatorId: AccountId;
  private readonly operatorKey: PrivateKey;
  private readonly pinata: PinataSDK;

  constructor() {
    console.log(`${process.env.ACCOUNT_ID}`);
    this.operatorId = AccountId.fromString(`${process.env.ACCOUNT_ID}`);
    this.operatorKey = PrivateKey.fromStringECDSA(
      `${process.env.PRIVATE_KEY_HEX}`,
    );
    const network = `${process.env.NETWORK}`;

    this.client = Client.forNetwork(network).setOperator(
      this.operatorId,
      this.operatorKey,
    );
    this.client.setDefaultMaxTransactionFee(new Hbar(100));
    this.client.setDefaultMaxQueryPayment(new Hbar(50));

    this.pinata = new PinataSDK({
      pinataJwt: `${process.env.PINATA_JWT}`,
      pinataGateway: `${process.env.PINATA_GATEWAY}`,
    });
  }

  /**
   * Create a new non-fungible token (NFT) representing land parcels.
   */
  async createLandToken(data: CreateTokenDto): Promise<string> {
    try {
      // console.log(`${process.env.ADMIN_PRIVATE_KEY}`)
      const adminPrivateKey = PrivateKey.fromStringECDSA(
        `${process.env.ADMIN_PRIVATE_KEY}`,
      );

      // const supplyKey = PrivateKey.generate();
      const adminPublicKey = adminPrivateKey.publicKey;

      const transaction = await new TokenCreateTransaction()
        .setTokenName(data.tokenName)
        .setTokenSymbol(data.tokenSymbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Infinite)
        .setSupplyKey(adminPrivateKey.publicKey)
        .setPauseKey(adminPublicKey)
        .setTreasuryAccountId(this.operatorId)
        .setAdminKey(adminPublicKey)
        .freezeWith(this.client);

      const signedTx = await transaction.sign(adminPrivateKey);
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      const tokenId = receipt.tokenId?.toString();
      if (tokenId) {
        this.logger.log(`Token successfully created: ${tokenId}`);
      }
      return tokenId || '';
    } catch (error) {
      this.logger.error('Error creating land token:', error);
      throw error;
    }
  }

  /**
   * Mint metadata for land parcels.
   * @param tokenId - The ID of the token to mint.
   * @param metadata - Array of metadata buffers for the parcels.
   */
  async mintLandToken(
    tokenId: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    try {
      const adminPrivateKey = PrivateKey.fromStringECDSA(
        `${process.env.ADMIN_PRIVATE_KEY}`,
      );

      const file = await this.uploadFileToPinata(metadata);

      const CIDs = [Buffer.from(`ipfs://${file.IpfsHash}`)];

      const transaction = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata(CIDs)
        .freezeWith(this.client);

      const signedTx = await transaction.sign(adminPrivateKey);
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      if (receipt.status.toString() === 'SUCCESS') {
        this.logger.log(
          `Successfully minted metadata for token ID: ${tokenId}`,
        );
      } else {
        this.logger.warn(`Minting metadata failed for token ID: ${tokenId}`);
      }
    } catch (error) {
      this.logger.error('Error minting token metadata:', error);
      throw error;
    }
  }

  /**
   * Pause a token on Hedera.
   * @param tokenId - The ID of the token to pause.
   */
  async pauseToken(tokenId: string): Promise<boolean> {
    try {
      const adminPrivateKey = PrivateKey.fromStringECDSA(
        `${process.env.ADMIN_PRIVATE_KEY}`,
      );

      const pauseTx = await new TokenPauseTransaction()
        .setTokenId(tokenId)
        .freezeWith(this.client);

      const signedPauseTx = await pauseTx.sign(adminPrivateKey);
      const pauseResponse = await signedPauseTx.execute(this.client);
      const pauseReceipt = await pauseResponse.getReceipt(this.client);

      if (pauseReceipt.status.toString() === 'SUCCESS') {
        this.logger.log(`Token successfully paused: ${tokenId}`);
        return true;
      } else {
        this.logger.warn(`Pausing token failed: ${tokenId}`);
        return false;
      }
    } catch (error) {
      this.logger.error('Error pausing token:', error);
      return false;
    }
  }

  async uploadFileToPinata(metadata: object): Promise<PinResponse> {
    try {
      const data = {
        name: 'LEAF1',
        creator: `${process.env.SERVICE_NAME}`,
        description: 'Autumn',
        image:
          'ipfs://bafkreidmnqjs3cb3t3tnowxods2o3dzijmdakha437h6lmfjc46ihfsg44',
        type: 'image/jpg',
        format: `${process.env.MINT_META_DATA_FORMAT}`,
        properties: {
          ...metadata,
        },
      };

      const file = new File([JSON.stringify(data)], `${uuidv4()}.json`, {
        type: 'application/json',
      });

      const upload = await this.pinata.upload.file(file);
      this.logger.log(`File uploaded to Pinata: ${upload.IpfsHash}`);
      return upload;
    } catch (error) {
      this.logger.error('Error uploading file to Pinata:', error);
      throw error;
    }
  }
}
