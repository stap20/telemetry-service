// cypod-telemetry
// src/shared/infrastructure/i18n/localization.service.ts
import { Injectable } from '@nestjs/common';

export type SupportedLocale = 'en' | 'ar';

const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'ar'];
const DEFAULT_LOCALE: SupportedLocale = 'en';

type Catalog = Record<string, string>;

// note: this is the MACHINE only — it holds no text of its own. Each module pushes its own
// shared/i18n catalogs in via register() at boot, so the service never imports a module and adding
// a module (or a whole new language) touches nothing here. Text lives with the module that owns it;
// translation happens at the HTTP boundary (the global filter), never in the domain.
@Injectable()
export class LocalizationService {
    private readonly catalogs = new Map<SupportedLocale, Catalog>();

    register(locale: SupportedLocale, messages: Catalog): void {
        const merged = { ...(this.catalogs.get(locale) ?? {}), ...messages };
        this.catalogs.set(locale, merged);
    }

    // note: pick the first supported language from Accept-Language (ignoring q-weights and region,
    // so "ar-EG" still resolves to "ar"); fall back to English when missing or unrecognized.
    resolveLocale(acceptLanguage?: string): SupportedLocale {
        if (!acceptLanguage) {
            return DEFAULT_LOCALE;
        }

        const requested = acceptLanguage
            .split(',')
            .map((part) => part.split(';')[0].trim().toLowerCase().split('-')[0]);

        return (
            requested.find((lang): lang is SupportedLocale =>
                SUPPORTED_LOCALES.includes(lang as SupportedLocale),
            ) ?? DEFAULT_LOCALE
        );
    }

    // note: fallback chain — chosen locale → English → the error's own English default → the raw
    // key. A forgotten translation degrades to English, never to a crash or a raw key on screen.
    translate(
        key: string,
        locale: SupportedLocale,
        params?: Record<string, string | number>,
        fallback?: string,
    ): string {
        const template =
            this.catalogs.get(locale)?.[key] ??
            this.catalogs.get(DEFAULT_LOCALE)?.[key] ??
            fallback ??
            key;

        return this.interpolate(template, params);
    }

    private interpolate(
        template: string,
        params?: Record<string, string | number>,
    ): string {
        if (!params) {
            return template;
        }

        return template.replace(/\{(\w+)\}/g, (match, name: string) =>
            params[name] !== undefined ? String(params[name]) : match,
        );
    }
}
