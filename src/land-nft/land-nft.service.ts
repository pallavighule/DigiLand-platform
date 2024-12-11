import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Long, TransferTransaction } from '@hashgraph/sdk';
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
  TokenUpdateNftsTransaction,
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
      throw new HttpException(
        'Error while uploading file on pinata: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      this.logger.error('Error uploading file to Pinata:', error);
    }
  }

  async updateTokenMetadata(tokenId: string): Promise<void> {
    try {
      const adminPrivateKey = PrivateKey.fromStringECDSA(
        `${process.env.ADMIN_PRIVATE_KEY}`,
      );

      const adminPublicKey = adminPrivateKey.publicKey;

      const nftSerialNumbers = [1];

      const CIDs = [
        Buffer.from(
          'ipfs://bafkreig6fiv7vheriq3shwpjmf7qazarjhlheiq22fjyei7oh7auncxiny',
        ),
      ];

      const concatenatedBuffer = Buffer.concat(CIDs);
      const uint8Array = new Uint8Array(concatenatedBuffer);

      // Create the TokenUpdateNftsTransaction
      const tokenUpdateNftsTx = await new TokenUpdateNftsTransaction()
        .setTokenId(tokenId)
        .setSerialNumbers([Long.fromInt(1)]) // Specify which NFTs to update by serial number
        .setMetadata(uint8Array) // Set the new metadata
        .freezeWith(this.client);

      // Sign the transaction with the metadata key
      const signedTx = await tokenUpdateNftsTx.sign(adminPrivateKey);

      // Execute the transaction
      const txResponse = await signedTx.execute(this.client);

      // Get the receipt
      const tokenUpdateNftsReceipt = await txResponse.getReceipt(this.client);

      // Log the transaction status
      if (tokenUpdateNftsReceipt.status.toString() === 'SUCCESS') {
        this.logger.log(
          `Successfully updated metadata for token ID: ${tokenId}`,
        );
      } else {
        this.logger.warn(`Metadata update failed for token ID: ${tokenId}`);
      }
    } catch (error) {
      this.logger.error('Error updating token metadata:', error);
      throw error;
    }
  }

  async transferLand(
    tokenId: string,
    fromAccountId: string,
    toAccountId: string,
    serialNumber: number,
  ): Promise<void> {
    try {
      this.logger.log(
        `Initiating transfer of token ${tokenId} from ${fromAccountId} to ${toAccountId} with serial number ${serialNumber}`,
      );

      // Create the TransferTransaction
      const transferTx = await new TransferTransaction()
        .addNftTransfer(tokenId, serialNumber, fromAccountId, toAccountId)
        .freezeWith(this.client); // Freeze the transaction with the client

      // Sign the transaction with the operator key
      const operatorKey = PrivateKey.fromStringECDSA(
        process.env.PRIVATE_KEY_HEX!,
      );
      const signTx = await transferTx.sign(operatorKey);

      // Execute the transaction
      const response = await signTx.execute(this.client);

      // Wait for the receipt to confirm the transaction
      const receipt = await response.getReceipt(this.client);

      // Log the transaction status
      if (receipt.status.toString() === 'SUCCESS') {
        this.logger.log(
          `Successfully transferred NFT (tokenId: ${tokenId}) from ${fromAccountId} to ${toAccountId}`,
        );
      } else {
        this.logger.warn(
          `NFT transfer failed for tokenId: ${tokenId} with status: ${receipt.status.toString()}`,
        );
      }
    } catch (error) {
      // Log the error
      this.logger.error(`Error during transfer: ${error.message}`, {
        tokenId,
        fromAccountId,
        toAccountId,
        serialNumber,
      });
      throw error;
    }
  }
}
