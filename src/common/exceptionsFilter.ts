import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request } from 'express';
// import { PrismaClient } from '@prisma/client';

// const { PrismaClientKnownRequestError, PrismaClientValidationError } =
//   PrismaClient;

@Catch()
export default class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '';
    switch (exception.constructor) {
      case HttpException:
        httpStatus = (exception as HttpException).getStatus();
        message = exception?.message || 'Internal server error';
        break;
        // case PrismaClientKnownRequestError:
        //   switch (exception.code) {
        //     case 'P2002': // Unique constraint failed on the {constraint}
        //     case 'P2000': // The provided value for the column is too long for the column's type. Column: {column_name}
        //     case 'P2001': // The record searched for in the where condition ({model_name}.{argument_name} = {argument_value}) does not exist
        //     case 'P2005': // The value {field_value} stored in the database for the field {field_name} is invalid for the field's type
        //     case 'P2006': // The provided value {field_value} for {model_name} field {field_name} is not valid
        //     case 'P2010': // Raw query failed. Code: {code}. Message: {message}
        //     case 'P2011': // Null constraint violation on the {constraint}
        //     case 'P2017': // The records for relation {relation_name} between the {parent_name} and {child_name} models are not connected.
        //     case 'P2021': // The table {table} does not exist in the current database.
        //     case 'P2022': // The column {column} does not exist in the current database.
        //       httpStatus = HttpStatus.BAD_REQUEST;
        //       message = exception?.message;
        //       break;
        //   case 'P2018': // The required connected records were not found. {details}
        //   case 'P2025': // An operation failed because it depends on one or more records that were required but not found. {cause}
        //   case 'P2015': // A related record could not be found. {details}
        //     httpStatus = HttpStatus.NOT_FOUND;
        //     message = exception?.message;
        //     break;
        //   default:
        //     httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        //     message = exception?.message || 'Internal server error';
        // }
        // break;
        // case PrismaClientValidationError:
        //   httpStatus = HttpStatus.BAD_REQUEST;
        //   message = exception?.message;
        //   break;
        // default:
        httpStatus =
          exception.response?.status ||
          exception.response?.statusCode ||
          HttpStatus.INTERNAL_SERVER_ERROR;
        message =
          exception.response?.data?.message ||
          exception.response?.message ||
          exception?.message ||
          'Internal server error';
    }

    Logger.error(
      'Exception Filter :',
      message,
      (exception as any).stack,
      `${request.method} ${request.url}`,
    );

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      message,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
