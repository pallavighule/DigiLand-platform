import { Injectable, Logger } from '@nestjs/common';
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
import { PinataSDK } from 'pinata-web3';

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
      pinataJwt:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI4OTg2ZTQ5OC1hYjM1LTRmNDMtYWFjMC05NDYzMDZjNGEyN2QiLCJlbWFpbCI6Imtob2xlc2FnYXI0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJmYmI5YmUxYjA4NTM1NDBjYmFlMiIsInNjb3BlZEtleVNlY3JldCI6IjEzOTFjNTlkZjNmODk1ZTkxNGE3YzQyMmYyZGU5YWU0ZTY4MGQ0NjRkYzY3YjkyZjdiMDI4NmU3MDQ1MWU5ZTkiLCJleHAiOjE3NjUxMTk0MDZ9.eZYK_orMKUTKL95I3OKxygtOjaO9ozSDkole0K82ywo',
      pinataGateway: 'moccasin-itchy-cheetah-968.mypinata.cloud',
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
  async mintLandToken(tokenId: string, metadata: Buffer[]): Promise<void> {
    try {
      const adminPrivateKey = PrivateKey.fromStringECDSA(
        `${process.env.ADMIN_PRIVATE_KEY}`,
      );

      // const metadata = {
      //   contentLocation: "ipfs://bafkreig73xgqp7wy7qvjwz33rp3nkxaxqlsb7v3id24poe2dath7pj5dhe",
      //   format: "HIP412@2.0.0",
      //   image: "ipfs://QmXbV2QztazJjAiZn1tv4oEBrSnRSRaXyDtnLLBp13ixNj",
      //   type: "image/jpg",
      //   properties: {
      //     city: "Boston",
      //     season: "Fall",
      //     decade: "20's",
      //     license: "MIT-0",
      //     collection: "Fall Collection",
      //     website: "www.hashgraph.com"
      //   }
      // };

      // // Base64-encode the metadata
      // const base64Metadata = [Buffer.from(JSON.stringify(metadata))];

      const myObject = {
        name: 'Token',
        type: 'NFT',
        properties: {
          creator: 'John Doe',
          license: 'MIT',
        },
      };

      // Convert the object to a JSON string
      const jsonString = JSON.stringify(myObject);

      // Convert the JSON string to a Uint8Array using TextEncoder
      const uint8Array = new TextEncoder().encode(jsonString);

      const CIDs = [
        Buffer.from(
          'ipfs://bafkreiantubzs4brdvb3fh4vhxgvd2fm672m5al3n5m2nqxbnftg6ungem',
        ),
      ];

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

  async uploadFileToPinata(): Promise<void> {}

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
