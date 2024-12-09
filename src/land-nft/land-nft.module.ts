import { Module } from '@nestjs/common';
import { LandNftController } from './land-nft.controller';
import { LandNFTService } from './land-nft.service';

@Module({
  controllers: [LandNftController],
  providers: [LandNFTService],
  exports: [LandNFTService],
})
export class LandNftModule {}
