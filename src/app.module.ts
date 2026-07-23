// cypod-telemetry
import { Module } from '@nestjs/common';
import { ConfigModule } from './shared/infrastructure/config/config.module';
import { CacheModule } from './shared/infrastructure/cache/cache.module';

@Module({
  imports: [ConfigModule, CacheModule],
})
export class AppModule {}
