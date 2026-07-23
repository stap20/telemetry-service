// cypod-telemetry
import { Module } from '@nestjs/common';
import { ConfigModule } from './shared/infrastructure/config/config.module';
import { CacheModule } from './shared/infrastructure/cache/cache.module';
import { I18nModule } from './shared/infrastructure/i18n/i18n.module';
import { AuthModule } from './modules/auth/shared/auth.module';

@Module({
  imports: [ConfigModule, CacheModule, I18nModule, AuthModule],
})
export class AppModule {}
