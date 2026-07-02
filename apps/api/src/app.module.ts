import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebController } from './web.controller';

@Module({
  imports: [],
  controllers: [AppController, WebController],
  providers: [AppService],
})
export class AppModule {}
