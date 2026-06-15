/**
 * Test bootstrap. Provides deterministic environment values BEFORE any module
 * that imports `config/env` is loaded, so unit tests never depend on a real
 * `.env` and never trigger the fail-fast guard.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://luma:luma@localhost:5432/luma_test?schema=public';
process.env.JWT_ACCESS_SECRET ??= 'test_access_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET ??= 'test_refresh_secret_at_least_32_characters_long';
process.env.COOKIE_SECRET ??= 'test_cookie_secret_value';
process.env.TAX_HOME_COUNTRY ??= 'FR';
process.env.TAX_PRICES_INCLUDE_TAX ??= 'true';
