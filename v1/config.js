/**
 * V1 dashboard configuration.
 * This file intentionally has its own cache namespace so /v1 never
 * overwrites data cached by the original dashboard.
 */
const CONFIG = {
  WEATHER_API_KEY: '4c974b3749e47d4abc84a2af95d8bae4',
  WEATHER_CITY: 'Santa Rosa Beach',
  WEATHER_COUNTRY: 'US',
  WEATHER_UNITS: 'metric',

  AQI_TOKEN: '7433bb39a54c31b191843a765a4a278eb11af53e',
  AQI_CITY: 'panama city beach',

  LATITUDE: 30.3468,
  LONGITUDE: -86.1915,

  TRADING_PAIR: 'KZTUSD',
  TRADING_SYMBOL: 'FX:USDKZT',
  EXCHANGE_BASE: 'USD',
  EXCHANGE_TARGET: 'KZT',

  WEATHER_INTERVAL: 12 * 60 * 60 * 1000,
  AQI_INTERVAL: 12 * 60 * 60 * 1000,
  EXCHANGE_INTERVAL: 5 * 60 * 1000,
  FX_HISTORY_INTERVAL: 60 * 60 * 1000,
  CLOCK_INTERVAL: 1000,

  TIMEZONE: 'America/Chicago',
  LOCALE: 'en-US',

  CACHE: {
    WEATHER: 'dash_v1_weather',
    AQI: 'dash_v1_aqi',
    EXCHANGE: 'dash_v1_exchange',
    FX_HISTORY: 'dash_v1_fx_history'
  }
};
