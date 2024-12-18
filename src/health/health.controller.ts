import { Controller, Get } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import {
  HealthCheckService,
  MicroserviceHealthIndicator,
  HealthCheck,
  HttpHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private microservice: MicroserviceHealthIndicator,

    private http: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  getHealth() {
    return this.health.check([
      async () =>
        this.microservice.pingCheck('NATS-server', {
          transport: Transport.NATS,
        }),
      () => this.http.pingCheck('sample-service', 'http://localhost:5000'),
    ]);
  }
}
