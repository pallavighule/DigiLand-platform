import { existsSync, mkdirSync } from 'fs';
import { Logger, format } from 'winston';
const ecsFormat = require('@elastic/ecs-winston-format');
var { ElasticsearchTransport } = require('winston-elasticsearch');
import winston = require('winston');
import { LoggerService } from '@nestjs/common';
const { combine, timestamp, prettyPrint } = format;

const logDir = './logs';

if (!existsSync(logDir)) {
  mkdirSync(logDir);
}

var esTransportOpts = {
  level: 'info',
  clientOpts: { node: 'http://localhost:9200/' },
};

const esTransport = new ElasticsearchTransport(esTransportOpts);

esTransport.on('error', (error) => {
  console.error('Error in logger caught', error);
});

// const logger: Logger = winston.createLogger({
//   format: ecsFormat({ convertReqRes: true }),
//   // format: combine(
//   //   timestamp(),
//   //   winston.format.json(),
//   //   prettyPrint()
//   // ),
//   transports: [
//     new winston.transports.Console(),
//     // new winston.transports.File({ filename: `${logDir}/combined.log` }),
//     new winston.transports.File({
//       //path to log file
//       filename: 'logs/log.json',
//       level: 'info',
//     }),
//     //Path to Elasticsearch
//     esTransport,
//   ],
// });

export class MyLogger implements LoggerService {
  logger: Logger;
  constructor() {
    this.logger = winston.createLogger({
      format: ecsFormat({ convertReqRes: true }),
      // format: combine(
      //   timestamp(),
      //   winston.format.json(),
      //   prettyPrint()
      // ),
      transports: [
        new winston.transports.Console(),
        // new winston.transports.File({ filename: `${logDir}/combined.log` }),
        new winston.transports.File({
          //path to log file
          filename: 'logs/log.json',
          level: 'info',
        }),
        //Path to Elasticsearch
        esTransport,
      ],
    });
    this.logger.on('error', (error) => {
      console.error('Error in logger caught', error);
    });
  }
  /**
   * Write a 'log' level log.
   */
  log(message: string) {
    return this.logger.info(message);
  }

  /**
   * Write an 'error' level log.
   */
  error(message: string) {
    this.logger.error(message);
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: string) {
    this.logger.warn(message);
  }

  /**
   * Write a 'debug' level log.
   */
  debug?(message: string) {
    this.logger.debug(message);
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose?(message: string) {
    this.logger.verbose(message);
  }
}
