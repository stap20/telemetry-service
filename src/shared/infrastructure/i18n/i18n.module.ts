// cypod-telemetry
// src/shared/infrastructure/i18n/i18n.module.ts
import { Global, Module } from '@nestjs/common';
import { LocalizationService } from './localization.service';

// note: global so every module can inject LocalizationService to register its own shared/i18n
// catalogs, and so the bootstrap can hand the same singleton to the global error filter.
@Global()
@Module({
    providers: [LocalizationService],
    exports: [LocalizationService],
})
export class I18nModule {}
