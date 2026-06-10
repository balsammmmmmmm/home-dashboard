/**
 * Dashboard Configuration
 * Edit these values to customize your dashboard
 */
const CONFIG = {
  // OpenWeather API - https://openweathermap.org/api
  WEATHER_API_KEY: '4c974b3749e47d4abc84a2af95d8bae4',
  WEATHER_CITY: 'Almaty',
  WEATHER_COUNTRY: 'KZ',
  WEATHER_UNITS: 'metric', // 'metric' for Celsius, 'imperial' for Fahrenheit

  // WAQI Air Quality API - https://waqi.info/
  AQI_TOKEN: '7433bb39a54c31b191843a765a4a278eb11af53e',
  AQI_CITY: 'almaty',

  // Location coordinates (used for precise weather)
  LATITUDE: 43.2220,
  LONGITUDE: 76.8512,

  // TradingView Widget config
  TRADING_PAIR: 'KZTUSD',
  TRADING_SYMBOL: 'FX:USDKZT', // TradingView symbol

  // Exchange rate API (free, no key needed)
  // Uses exchangerate-api.com or similar
  EXCHANGE_BASE: 'USD',
  EXCHANGE_TARGET: 'KZT',

  // Update intervals (milliseconds)
  WEATHER_INTERVAL: 12 * 60 * 60 * 1000,   // 12 hours
  AQI_INTERVAL: 12 * 60 * 60 * 1000,       // 12 hours
  EXCHANGE_INTERVAL: 5 * 60 * 1000,   // 5 minutes
  CLOCK_INTERVAL: 1000,                // 1 second

  // Display
  TIMEZONE: 'Asia/Almaty',
  LOCALE: 'en-US',

  // Cache keys
  CACHE: {
    WEATHER: 'dash_weather',
    AQI: 'dash_aqi',
    EXCHANGE: 'dash_exchange',
  }
};
