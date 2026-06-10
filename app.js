/**
 * LUXURY SMART HOME DASHBOARD — app.js
 * Modular, production-ready vanilla JS
 */

/* ============================================================
   1. PARTICLES BACKGROUND
   ============================================================ */
const Particles = (() => {
  let canvas, ctx, particles = [], animId;

  const init = () => {
    canvas = document.getElementById('particles');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    spawnParticles();
    loop();
    window.addEventListener('resize', resize);
  };

  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  const spawnParticles = () => {
    const count = Math.floor((window.innerWidth * window.innerHeight) / 22000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.2 + 0.2,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }
  };

  const loop = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width)  p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 200, 255, ${p.alpha})`;
      ctx.fill();
    });
    animId = requestAnimationFrame(loop);
  };

  return { init };
})();

/* ============================================================
   2. CLOCK MODULE
   ============================================================ */
const Clock = (() => {
  let el_time, el_date, el_greeting;

  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const pad = n => String(n).padStart(2, '0');

  const greeting = h => {
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    if (h < 21) return 'Good Evening';
    return 'Good Night';
  };

  const update = () => {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    const day = DAYS[now.getDay()];
    const date = `${day}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    if (el_time)
      el_time.innerHTML = `${pad(h)}<span class="colon">:</span>${pad(m)}`;

    if (el_date) el_date.textContent = date;

    if (el_greeting) {
      el_greeting.innerHTML = `${greeting(h)}, <span>Almaty</span>`;
    }
  };

  const init = () => {
    el_time     = document.getElementById('clock-time');
    el_date     = document.getElementById('clock-date');
    el_greeting = document.getElementById('greeting');
    update();
    setInterval(update, CONFIG.CLOCK_INTERVAL);
  };

  return { init };
})();

/* ============================================================
   3. CACHE UTILITY
   ============================================================ */
const Cache = {
  set: (key, data, ttl) => {
    try {
      localStorage.setItem(key, JSON.stringify({ data, exp: Date.now() + ttl }));
    } catch (e) {}
  },
  get: (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { data, exp } = JSON.parse(raw);
      return Date.now() < exp ? data : null;
    } catch (e) { return null; }
  }
};

/* ============================================================
   4. WEATHER MODULE
   ============================================================ */
const Weather = (() => {
  const WX_ICONS = {
    '01d':'☀️','01n':'🌙','02d':'⛅','02n':'☁️','03d':'☁️','03n':'☁️',
    '04d':'☁️','04n':'☁️','09d':'🌧️','09n':'🌧️','10d':'🌦️','10n':'🌧️',
    '11d':'⛈️','11n':'⛈️','13d':'❄️','13n':'❄️','50d':'🌫️','50n':'🌫️',
  };

  const toIcon = code => WX_ICONS[code] || '🌡️';

  const render = (w, forecast) => {
    const cur = w.current;
    const icon  = toIcon(cur.weather[0].icon);
    const temp  = Math.round(cur.main.temp);
    const feels = Math.round(cur.main.feels_like);
    const desc  = cur.weather[0].description;
    const hum   = cur.main.humidity;
    const wind  = (cur.wind.speed * 3.6).toFixed(1); // m/s → km/h
    const sunrise = new Date(cur.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
    const sunset  = new Date(cur.sys.sunset  * 1000).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

    document.getElementById('wx-icon').textContent  = icon;
    document.getElementById('wx-temp').textContent  = `${temp}°`;
    document.getElementById('wx-feels').textContent = `Feels ${feels}°`;
    document.getElementById('wx-desc').textContent  = desc;
    document.getElementById('wx-hum').textContent   = `${hum}%`;
    document.getElementById('wx-wind').textContent  = `${wind} km/h`;
    document.getElementById('wx-rise').textContent  = sunrise;
    document.getElementById('wx-set').textContent   = sunset;

    // Forecast
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const fcEl = document.getElementById('wx-forecast');
    if (!fcEl || !forecast) return;
    fcEl.innerHTML = '';
    forecast.forEach(f => {
      const d = document.createElement('div');
      d.className = 'forecast-day';
      const dayName = days[new Date(f.dt * 1000).getDay()];
      d.innerHTML = `
        <div class="fc-day">${dayName}</div>
        <div class="fc-icon">${toIcon(f.weather[0].icon)}</div>
        <div class="fc-hi">${Math.round(f.main.temp_max)}°</div>
        <div class="fc-lo">${Math.round(f.main.temp_min)}°</div>
      `;
      fcEl.appendChild(d);
    });

    // Weather glow based on condition
    const body = document.body;
    if (cur.weather[0].main === 'Clear') {
      document.documentElement.style.setProperty('--weather-glow', '255, 200, 50');
    } else if (cur.weather[0].main === 'Rain' || cur.weather[0].main === 'Drizzle') {
      document.documentElement.style.setProperty('--weather-glow', '0, 100, 255');
    } else {
      document.documentElement.style.setProperty('--weather-glow', '0, 200, 255');
    }
    Refresh.mark('weather');
  };

  const fetch5Day = async () => {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${CONFIG.LATITUDE}&lon=${CONFIG.LONGITUDE}&appid=${CONFIG.WEATHER_API_KEY}&units=${CONFIG.WEATHER_UNITS}`;
    const res = await fetch(url);
    const data = await res.json();
    // pick one per day at noon
    const seen = new Set();
    return data.list.filter(f => {
      const day = new Date(f.dt * 1000).toDateString();
      if (seen.has(day)) return false;
      seen.add(day); return true;
    }).slice(1, 6);
  };

  const fetchCurrent = async () => {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${CONFIG.LATITUDE}&lon=${CONFIG.LONGITUDE}&appid=${CONFIG.WEATHER_API_KEY}&units=${CONFIG.WEATHER_UNITS}`;
    const res = await fetch(url);
    return res.json();
  };

  const load = async () => {
    const cached = Cache.get(CONFIG.CACHE.WEATHER);
    if (cached) { render(cached.w, cached.f); return; }

    try {
      const [w, f] = await Promise.all([fetchCurrent(), fetch5Day()]);
      render({ current: w }, f);
      Cache.set(CONFIG.CACHE.WEATHER, { w: { current: w }, f }, CONFIG.WEATHER_INTERVAL);
    } catch (e) {
      document.getElementById('wx-icon').textContent = '⚠️';
      document.getElementById('wx-temp').textContent = '--°';
      console.error('Weather error:', e);
    }
  };

  const init = () => {
    load();
    setInterval(load, CONFIG.WEATHER_INTERVAL);
  };

  return { init };
})();

/* ============================================================
   5. AQI MODULE
   ============================================================ */
const AQI = (() => {
  const LEVELS = [
    { max: 50,  label: 'Good',            color: '#00e5a0', rec: 'Air quality is satisfactory. Enjoy outdoor activities.' },
    { max: 100, label: 'Moderate',         color: '#ffd166', rec: 'Acceptable air quality. Sensitive individuals may limit prolonged outdoor exertion.' },
    { max: 150, label: 'Unhealthy for Some',color: '#ff9a3c', rec: 'Members of sensitive groups may experience health effects. Reduce prolonged outdoor exertion.' },
    { max: 200, label: 'Unhealthy',         color: '#ff4d6d', rec: 'Everyone may begin to experience health effects. Limit prolonged outdoor exertion.' },
    { max: 300, label: 'Very Unhealthy',    color: '#c77dff', rec: 'Health alert — everyone may experience more serious health effects. Avoid outdoor exertion.' },
    { max: 999, label: 'Hazardous',         color: '#8b1a2e', rec: 'Health emergency — everyone is more likely to be affected. Stay indoors and avoid outdoor activity.' },
  ];

  const getLevel = aqi => LEVELS.find(l => aqi <= l.max) || LEVELS[LEVELS.length - 1];

  const setGauge = (aqi, color) => {
    const arc = document.getElementById('aqi-arc');
    const numEl = document.getElementById('aqi-num');
    if (!arc || !numEl) return;
    const maxAQI = 300;
    const pct = Math.min(aqi / maxAQI, 1);
    const radius = 36;
    const circ = 2 * Math.PI * radius;
    const dash = circ * pct;
    arc.style.strokeDasharray  = `${dash} ${circ}`;
    arc.style.stroke = color;
    numEl.style.color = color;
    numEl.textContent = aqi;
  };

  const render = (data) => {
    const aqi = data.aqi;
    const level = getLevel(aqi);
    setGauge(aqi, level.color);
    const catEl = document.getElementById('aqi-category');
    if (catEl) { catEl.textContent = level.label; catEl.style.color = level.color; }
    document.getElementById('aqi-pm25') && (document.getElementById('aqi-pm25').textContent = data.pm25 ?? '--');
    document.getElementById('aqi-pm10') && (document.getElementById('aqi-pm10').textContent = data.pm10 ?? '--');
    const recEl = document.getElementById('aqi-rec');
    if (recEl) { recEl.textContent = level.rec; recEl.style.borderLeftColor = level.color; }
    Refresh.mark('aqi');
  };

  const load = async () => {
    const cached = Cache.get(CONFIG.CACHE.AQI);
    if (cached) { render(cached); return; }

    try {
      const url = `https://api.waqi.info/feed/${CONFIG.AQI_CITY}/?token=${CONFIG.AQI_TOKEN}`;
      const res  = await fetch(url);
      const json = await res.json();
      if (json.status !== 'ok') throw new Error('AQI API error');
      const d = json.data;
      const payload = {
        aqi:  d.aqi,
        pm25: d.iaqi?.pm25?.v,
        pm10: d.iaqi?.pm10?.v,
      };
      render(payload);
      Cache.set(CONFIG.CACHE.AQI, payload, CONFIG.AQI_INTERVAL);
    } catch (e) {
      document.getElementById('aqi-num') && (document.getElementById('aqi-num').textContent = '—');
      console.error('AQI error:', e);
    }
  };

  const init = () => {
    // Set initial SVG gauge
    const arc = document.getElementById('aqi-arc');
    if (arc) {
      const radius = 36;
      const circ = 2 * Math.PI * radius;
      arc.style.strokeDasharray = `0 ${circ}`;
      arc.setAttribute('stroke-dashoffset', '0');
    }
    load();
    setInterval(load, CONFIG.AQI_INTERVAL);
  };

  return { init };
})();

/* ============================================================
   6. EXCHANGE RATE MODULE (USD/KZT)
   ============================================================ */
const Exchange = (() => {
  let lastRate = null;

  const animateNum = (el, from, to, decimals = 2) => {
    const duration = 800;
    const start = performance.now();
    const update = (t) => {
      const prog = Math.min((t - start) / duration, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      el.textContent = (from + (to - from) * ease).toFixed(decimals);
      if (prog < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };

  const render = (rate, prev) => {
    const rateEl  = document.getElementById('exch-rate');
    const chgEl   = document.getElementById('exch-change');
    const metaEl  = document.getElementById('exch-meta');

    if (rateEl) {
      if (prev && prev !== rate) {
        animateNum(rateEl, prev, rate, 2);
      } else {
        rateEl.textContent = rate.toFixed(2);
      }
    }

    if (chgEl && prev) {
      const diff = rate - prev;
      const pct  = ((diff / prev) * 100).toFixed(2);
      const up   = diff > 0;
      const flat = diff === 0;
      chgEl.textContent = flat ? '0.00%' : `${up ? '+' : ''}${pct}%`;
      chgEl.className = `change-badge ${flat ? 'flat' : up ? 'up' : 'down'}`;
    }

    if (metaEl) {
      const now = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
      metaEl.textContent = `Updated ${now}`;
    }

    Refresh.mark('exchange');
  };

  const load = async () => {
    const cached = Cache.get(CONFIG.CACHE.EXCHANGE);
    if (cached) {
      render(cached.rate, lastRate ?? cached.prev);
      lastRate = cached.rate;
      return;
    }

    try {
      // Use exchangerate.host (free, no key needed)
      const res  = await fetch(`https://api.exchangerate.host/latest?base=USD&symbols=KZT`);
      const json = await res.json();
      const rate = json.rates?.KZT;
      if (!rate) throw new Error('No rate');
      const payload = { rate, prev: lastRate };
      render(rate, lastRate);
      Cache.set(CONFIG.CACHE.EXCHANGE, payload, CONFIG.EXCHANGE_INTERVAL);
      lastRate = rate;
    } catch (e) {
      // Fallback: try frankfurter.app
      try {
        const res  = await fetch(`https://api.frankfurter.app/latest?from=USD&to=KZT`);
        const json = await res.json();
        const rate = json.rates?.KZT;
        if (!rate) throw new Error('No rate fallback');
        const payload = { rate, prev: lastRate };
        render(rate, lastRate);
        Cache.set(CONFIG.CACHE.EXCHANGE, payload, CONFIG.EXCHANGE_INTERVAL);
        lastRate = rate;
      } catch (e2) {
        const rateEl = document.getElementById('exch-rate');
        if (rateEl) rateEl.textContent = '--';
        console.error('Exchange error:', e2);
      }
    }
  };

  const init = () => {
    load();
    setInterval(load, CONFIG.EXCHANGE_INTERVAL);
  };

  return { init };
})();

/* ============================================================
   7. TRADINGVIEW WIDGET
   ============================================================ */
const TradingViewWidget = (() => {
  let currentInterval = '1D';

  const INTERVAL_MAP = {
    '1D': 'D', '1W': 'W', '1M': 'M', '3M': '3M', '1Y': '12M'
  };

  const load = (interval) => {
    const container = document.getElementById('tradingview-widget-container');
    if (!container) return;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src  = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'FX:USDKZT',
      interval: INTERVAL_MAP[interval] || 'D',
      timezone: CONFIG.TIMEZONE,
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(5, 12, 20, 0)',
      gridColor: 'rgba(0, 200, 255, 0.05)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      container_id: 'tradingview-widget-container',
      overrides: {
        'paneProperties.background': 'rgba(5,12,20,0)',
        'paneProperties.backgroundType': 'solid',
        'paneProperties.vertGridProperties.color': 'rgba(0,200,255,0.04)',
        'paneProperties.horzGridProperties.color': 'rgba(0,200,255,0.04)',
        'symbolWatermarkProperties.transparency': 100,
        'scalesProperties.textColor': 'rgba(160,190,230,0.6)',
        'mainSeriesProperties.candleStyle.upColor':   '#00e5a0',
        'mainSeriesProperties.candleStyle.downColor': '#ff4d6d',
        'mainSeriesProperties.candleStyle.borderUpColor': '#00e5a0',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ff4d6d',
        'mainSeriesProperties.candleStyle.wickUpColor': '#00e5a0',
        'mainSeriesProperties.candleStyle.wickDownColor': '#ff4d6d',
      }
    });
    container.appendChild(script);
  };

  const init = () => {
    load(currentInterval);

    document.querySelectorAll('.tv-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tv-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentInterval = tab.dataset.interval;
        load(currentInterval);
      });
    });
  };

  return { init };
})();

/* ============================================================
   8. SYSTEM STATUS MODULE
   ============================================================ */
const SystemStatus = (() => {
  const updateNetwork = () => {
    const dot   = document.getElementById('net-dot');
    const label = document.getElementById('net-label');
    const online = navigator.onLine;
    if (dot) {
      dot.className = `status-dot ${online ? '' : 'offline'}`;
    }
    if (label) label.textContent = online ? 'Online' : 'Offline';
  };

  const updateBattery = async () => {
    if (!navigator.getBattery) return;
    try {
      const bat = await navigator.getBattery();
      const pct = Math.round(bat.level * 100);
      const charging = bat.charging;

      const pctEl   = document.getElementById('bat-pct');
      const fillEl  = document.getElementById('bat-fill');
      const chgEl   = document.getElementById('bat-charging');

      if (pctEl)  pctEl.textContent  = `${pct}%`;
      if (chgEl)  chgEl.textContent  = charging ? '⚡ Charging' : 'On Battery';
      if (fillEl) {
        fillEl.style.width = `${pct}%`;
        fillEl.className = `battery-bar-fill ${pct < 20 ? 'low' : pct < 50 ? 'mid' : ''}`;
      }

      bat.addEventListener('levelchange', updateBattery);
      bat.addEventListener('chargingchange', updateBattery);
    } catch (e) {}
  };

  const updateTime = () => {
    const el = document.getElementById('sys-tz');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-US', { timeZone: CONFIG.TIMEZONE, hour:'2-digit', minute:'2-digit', second:'2-digit' });
  };

  const init = () => {
    updateNetwork();
    updateBattery();
    updateTime();
    setInterval(updateNetwork, 5000);
    setInterval(updateTime, 1000);
    window.addEventListener('online',  updateNetwork);
    window.addEventListener('offline', updateNetwork);
  };

  return { init };
})();

/* ============================================================
   9. REFRESH TRACKER
   ============================================================ */
const Refresh = (() => {
  const times = {};

  const mark = (key) => {
    times[key] = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
    const el = document.getElementById(`refresh-${key}`);
    if (el) el.textContent = times[key];
  };

  const refreshAll = async () => {
    Cache.set(CONFIG.CACHE.WEATHER, null, 0); // bust cache
    Cache.set(CONFIG.CACHE.AQI, null, 0);
    Cache.set(CONFIG.CACHE.EXCHANGE, null, 0);
    Weather.init?.();
    AQI.init?.();
    Exchange.init?.();
  };

  return { mark, refreshAll };
})();

/* ============================================================
   10. DOCK / UI CONTROLS
   ============================================================ */
const Dock = (() => {
  let hidden = false;
  let timer;

  const showDock = () => {
    const dock = document.getElementById('dock');
    if (!dock) return;
    dock.classList.remove('hidden');
    clearTimeout(timer);
    timer = setTimeout(() => {
      dock.classList.add('hidden');
    }, 4000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const openSettings = () => {
    alert('Settings: Edit config.js to change API keys, city, and intervals.');
  };

  const forceRefresh = () => {
    localStorage.clear();
    location.reload();
  };

  const init = () => {
    const dock = document.getElementById('dock');
    if (!dock) return;

    document.addEventListener('mousemove', showDock);
    document.addEventListener('touchstart', showDock);

    // show initially for 4s
    showDock();

    document.getElementById('btn-fullscreen')?.addEventListener('click', toggleFullscreen);
    document.getElementById('btn-settings')?.addEventListener('click', openSettings);
    document.getElementById('btn-refresh')?.addEventListener('click', forceRefresh);

    // Fullscreen change icon
    document.addEventListener('fullscreenchange', () => {
      const btn = document.getElementById('btn-fullscreen');
      if (btn) btn.innerHTML = document.fullscreenElement ? '⛶' : '⛶';
    });
  };

  return { init };
})();

/* ============================================================
   11. BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  Particles.init();
  Clock.init();
  Weather.init();
  AQI.init();
  Exchange.init();
  TradingViewWidget.init();
  SystemStatus.init();
  Dock.init();
});
