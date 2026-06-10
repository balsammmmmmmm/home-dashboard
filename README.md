# 🏠 Luxury Smart Home Dashboard

A premium dark-mode dashboard designed for wall-mounted Android tablets. Displays real-time weather, AQI, USD/KZT exchange rate with TradingView chart, and system status.

---

## ✨ Features

| Module | Source | Refresh |
|---|---|---|
| 🌤️ Weather + 5-day | OpenWeather API | Every 15 min |
| 🌬️ Air Quality (AQI) | WAQI API | Every 15 min |
| 💱 USD/KZT Rate | ExchangeRate.host | Every 5 min |
| 📈 TradingView Chart | TradingView Widget | Live |
| 🔋 System Status | Browser APIs | Live |
| 🕐 Clock | Browser | Every second |

---

## 🚀 Deploy to GitHub Pages

1. Fork or upload all files to a GitHub repo
2. Go to **Settings → Pages**
3. Set source branch to `main` (or `master`) and folder to `/root`
4. Your dashboard will be live at `https://yourname.github.io/repo-name`

---

## ⚙️ Configuration

Edit `config.js` to customize:

```js
WEATHER_API_KEY: 'your-openweather-key',
AQI_TOKEN:       'your-waqi-token',
WEATHER_CITY:    'Almaty',
LATITUDE:        43.2220,
LONGITUDE:       76.8512,
TIMEZONE:        'Asia/Almaty',
```

### Getting API Keys

- **OpenWeather**: Free at [openweathermap.org/api](https://openweathermap.org/api)
- **WAQI**: Free at [aqicn.org/data-platform/token](https://aqicn.org/data-platform/token/)
- **Exchange Rate**: No key needed (uses `exchangerate.host` free tier)
- **TradingView**: No key needed (public widget)

---

## 📁 File Structure

```
dashboard/
├── index.html      — Main HTML shell
├── styles.css      — Glassmorphism dark theme
├── app.js          — All dashboard modules
├── config.js       — API keys & settings
└── README.md       — This file
```

---

## 📱 Tablet Setup (Android)

1. Open Chrome on your tablet
2. Navigate to your GitHub Pages URL
3. Tap the 3-dot menu → **Add to Home Screen**
4. Open the app icon — it launches in full-screen kiosk mode
5. Keep the screen always on: `Settings → Display → Screen Timeout → Never`

### Recommended Tablets
- Samsung Galaxy Tab A8/A9
- Any 10" Android tablet
- iPad (any)

---

## 🎨 Design System

| Token | Value |
|---|---|
| Background | `#020408` |
| Navy | `#0a1628` |
| Accent Cyan | `#00c8ff` |
| Green | `#00e5a0` |
| Red | `#ff4d6d` |
| Font Body | Inter |
| Font Mono | JetBrains Mono |

---

## 🔒 Privacy

All API keys are client-side (public). For production, limit your OpenWeather key by HTTP referrer in the OpenWeather dashboard. WAQI and ExchangeRate.host have no referrer restrictions on free tiers.

---

Made with ♥ for wall-mounted luxury dashboards.
