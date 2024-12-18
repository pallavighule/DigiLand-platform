import { Test, TestingModule } from '@nestjs/testing';
import { LandNftController } from './land-nft.controller';

describe('LandNftController', () => {
  let controller: LandNftController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LandNftController],
    }).compile();

    controller = module.get<LandNftController>(LandNftController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
