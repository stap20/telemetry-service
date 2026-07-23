// cypod-telemetry
import { Module } from '@nestjs/common';
import { ConfigModule } from './shared/infrastructure/config/config.module';
import { CacheModule } from './shared/infrastructure/cache/cache.module';
import { EventModule } from './shared/infrastructure/event/event.module';
import { I18nModule } from './shared/infrastructure/i18n/i18n.module';
import { IdModule } from './shared/infrastructure/id/id.module';
import { AuthModule } from './modules/auth/shared/auth.module';
import { DevicesModule } from './modules/devices/shared/devices.module';

@Module({
  imports: [ConfigModule, CacheModule, EventModule, I18nModule, IdModule, AuthModule, DevicesModule],
})
export class AppModule {}
