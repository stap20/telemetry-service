// cypod-telemetry
import { Module } from '@nestjs/common';
import { ConfigModule } from './shared/infrastructure/config/config.module';
import { CacheModule } from './shared/infrastructure/cache/cache.module';
import { AuthModule } from './modules/auth/shared/auth.module';

@Module({
  imports: [ConfigModule, CacheModule, AuthModule],
})
export class AppModule {}
