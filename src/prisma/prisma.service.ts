// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { PrismaClient } from '@prisma/client';

// @Injectable()
// export default class PrismaService
//   extends PrismaClient
//   implements OnModuleInit, OnModuleDestroy
// {
//   constructor(private configService: ConfigService) {
//     super();
//   }

//   async onModuleInit() {
//     const prisma = new PrismaClient({
//       datasources: {
//         db: {
//           url: this.configService.get('DATABASE_URL'),
//         },
//       },
//     });
//     await prisma.$connect();
//   }

//   async onModuleDestroy() {
//     await this.$disconnect();
//   }
// }
