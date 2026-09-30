/*
 * V1 dashboard runtime.
 * The modules intentionally remain browser-only and dependency-free so this
 * folder can be deployed as a separate static page.
 */

const $ = id => document.getElementById(id);

const setText = (id, value) => {
  const element = $(id);
  if (element) element.textContent = value;
};

const fetchJson = async url => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

const Cache = {
  set(key, data, ttl) {
    try {
      localStorage.setItem(key, JSON.stringify({ data, exp: Date.now() + ttl }));
    } catch (error) {
      // Local storage can be unavailable in private browsing contexts.
    }
  },

  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      return Date.now() < cached.exp ? cached.data : null;
    } catch (error) {
      return null;
    }
  },

  clear(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {}
  }
};

const Time = {
  clock(timeZone = CONFIG.TIMEZONE, withSeconds = false) {
    return new Intl.DateTimeFormat(CONFIG.LOCALE, {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      ...(withSeconds ? { second: '2-digit' } : {}),
      hour12: false,
      hourCycle: 'h23'
    }).format(new Date());
  },

  date(timeZone = CONFIG.TIMEZONE) {
    return new Intl.DateTimeFormat(CONFIG.LOCALE, {
      timeZone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date());
  },

  shortDate(timestamp) {
    return new Intl.DateTimeFormat(CONFIG.LOCALE, {
      timeZone: CONFIG.TIMEZONE,
      weekday: 'short'
    }).format(new Date(timestamp * 1000));
  },

  localTime(timestamp) {
    return new Intl.DateTimeFormat(CONFIG.LOCALE, {
      timeZone: CONFIG.TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(timestamp * 1000));
  }
};

const Clock = (() => {
  const update = () => {
    const time = Time.clock();
    const timeElement = $('clock-time');
    if (timeElement) {
      const [hour, minute] = time.split(':');
      timeElement.innerHTML = `${hour}<span class="colon">:</span>${minute}`;
    }
    setText('clock-date', Time.date());
    setText('sys-tz', Time.clock(CONFIG.TIMEZONE, true));
  };

  const init = () => {
    update();
    setInterval(update, CONFIG.CLOCK_INTERVAL);
  };

  return { init };
})();

const Refresh = (() => {
  const mark = key => {
    setText(`refresh-${key}`, Time.clock(undefined, false));
  };

  const setState = value => setText('refresh-status', value);

  return { mark, setState };
})();

const Weather = (() => {
  const WX_ICONS = {
    '01d': '☀', '01n': '◐', '02d': '◒', '02n': '◒',
    '03d': '☁', '03n': '☁', '04d': '☁', '04n': '☁',
    '09d': '☂', '09n': '☂', '10d': '☂', '10n': '☂',
    '11d': 'ϟ', '11n': 'ϟ', '13d': '❄', '13n': '❄',
    '50d': '≋', '50n': '≋'
  };

  const toIcon = code => WX_ICONS[code] || '·';

  const render = (weather, forecast) => {
    const current = weather.current;
    const condition = current.weather?.[0] || {};
    const temp = Math.round(current.main.temp);
    const feels = Math.round(current.main.feels_like);
    const wind = (current.wind.speed * 3.6).toFixed(1);

    setText('wx-icon', toIcon(condition.icon));
    setText('wx-temp', `${temp}°`);
    setText('wx-feels', `FEELS ${feels}°`);
    setText('wx-desc', condition.description || 'Unavailable');
    setText('wx-hum', `${current.main.humidity}%`);
    setText('wx-wind', `${wind} km/h`);
    setText('wx-rise', Time.localTime(current.sys.sunrise));
    setText('wx-set', Time.localTime(current.sys.sunset));

    const forecastElement = $('wx-forecast');
    if (forecastElement && forecast?.length) {
      forecastElement.innerHTML = forecast.map(item => {
        const itemWeather = item.weather?.[0] || {};
        return `
          <div class="forecast-day">
            <span class="fc-day">${Time.shortDate(item.dt)}</span>
            <span class="fc-icon">${toIcon(itemWeather.icon)}</span>
            <span class="fc-hi">${Math.round(item.main.temp_max)}°</span>
            <span class="fc-lo">${Math.round(item.main.temp_min)}°</span>
          </div>
        `;
      }).join('');
    }

    Refresh.mark('weather');
  };

  const fetchCurrent = () => fetchJson(
    `https://api.openweathermap.org/data/2.5/weather?lat=${CONFIG.LATITUDE}&lon=${CONFIG.LONGITUDE}&appid=${CONFIG.WEATHER_API_KEY}&units=${CONFIG.WEATHER_UNITS}`
  );

  const fetchForecast = async () => {
    const data = await fetchJson(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${CONFIG.LATITUDE}&lon=${CONFIG.LONGITUDE}&appid=${CONFIG.WEATHER_API_KEY}&units=${CONFIG.WEATHER_UNITS}`
    );
    const seen = new Set();
    return (data.list || []).filter(item => {
      const day = new Date(item.dt * 1000).toDateString();
      if (seen.has(day)) return false;
      seen.add(day);
      return true;
    }).slice(1, 6);
  };

  const load = async () => {
    const cached = Cache.get(CONFIG.CACHE.WEATHER);
    if (cached) {
      render(cached.weather, cached.forecast);
      return;
    }

    try {
      const [current, forecast] = await Promise.all([fetchCurrent(), fetchForecast()]);
      const payload = { weather: { current }, forecast };
      render(payload.weather, payload.forecast);
      Cache.set(CONFIG.CACHE.WEATHER, payload, CONFIG.WEATHER_INTERVAL);
    } catch (error) {
      setText('wx-icon', '!');
      setText('wx-temp', '--°');
      setText('wx-desc', 'WEATHER UNAVAILABLE');
      console.error('V1 weather error:', error);
    }
  };

  const init = () => {
    load();
    setInterval(load, CONFIG.WEATHER_INTERVAL);
  };

  return { init, load };
})();

const AQI = (() => {
  const LEVELS = [
    { max: 50, label: 'Good', recommendation: 'Air quality is satisfactory. Enjoy outdoor activities.' },
    { max: 100, label: 'Moderate', recommendation: 'Acceptable air quality. Sensitive individuals may limit prolonged outdoor exertion.' },
    { max: 150, label: 'Unhealthy for Some', recommendation: 'Sensitive groups may experience health effects. Reduce prolonged outdoor exertion.' },
    { max: 200, label: 'Unhealthy', recommendation: 'Everyone may begin to experience health effects. Limit prolonged outdoor exertion.' },
    { max: 300, label: 'Very Unhealthy', recommendation: 'Health alert. Avoid prolonged outdoor exertion.' },
    { max: 999, label: 'Hazardous', recommendation: 'Health emergency. Stay indoors and avoid outdoor activity.' }
  ];

  const render = data => {
    const aqi = Number(data.aqi);
    const level = LEVELS.find(item => aqi <= item.max) || LEVELS[LEVELS.length - 1];
    const meter = $('aqi-meter-fill');
    if (meter) meter.style.width = `${Math.min((aqi / 300) * 100, 100)}%`;
    setText('aqi-num', Number.isFinite(aqi) ? aqi : '--');
    setText('aqi-category', level.label);
    setText('aqi-pm25', data.pm25 ?? '--');
    setText('aqi-pm10', data.pm10 ?? '--');
    setText('aqi-rec', level.recommendation);
    Refresh.mark('aqi');
  };

  const load = async () => {
    const cached = Cache.get(CONFIG.CACHE.AQI);
    if (cached) {
      render(cached);
      return;
    }

    try {
      const json = await fetchJson(`https://api.waqi.info/feed/${CONFIG.AQI_CITY}/?token=${CONFIG.AQI_TOKEN}`);
      if (json.status !== 'ok') throw new Error('AQI API error');
      const data = {
        aqi: json.data.aqi,
        pm25: json.data.iaqi?.pm25?.v,
        pm10: json.data.iaqi?.pm10?.v
      };
      render(data);
      Cache.set(CONFIG.CACHE.AQI, data, CONFIG.AQI_INTERVAL);
    } catch (error) {
      setText('aqi-num', '--');
      setText('aqi-category', 'UNAVAILABLE');
      setText('aqi-rec', 'Air quality data could not be loaded.');
      console.error('V1 AQI error:', error);
    }
  };

  const init = () => {
    load();
    setInterval(load, CONFIG.AQI_INTERVAL);
  };

  return { init, load };
})();

const Exchange = (() => {
  let lastRate = null;

  const render = (rate, previous = null) => {
    setText('exch-rate', Number(rate).toFixed(2));

    const changeElement = $('exch-change');
    if (changeElement && previous !== null && Number(previous) !== Number(rate)) {
      const difference = Number(rate) - Number(previous);
      const percentage = ((difference / Number(previous)) * 100).toFixed(2);
      changeElement.textContent = `${difference > 0 ? '+' : ''}${percentage}%`;
      changeElement.className = `change-badge ${difference > 0 ? 'up' : 'down'}`;
    } else if (changeElement) {
      changeElement.textContent = previous === null ? '--%' : '0.00%';
      changeElement.className = 'change-badge flat';
    }

    setText('exch-meta', `UPDATED ${Time.clock()}`);
    Refresh.mark('exchange');
  };

  const getRate = async () => {
    try {
      const data = await fetchJson('https://api.frankfurter.dev/v2/rate/USD/KZT');
      if (!data.rate) throw new Error('No Frankfurter rate');
      return data.rate;
    } catch (error) {
      const data = await fetchJson('https://api.exchangerate-api.com/v4/latest/USD');
      if (!data.rates?.KZT) throw new Error('No fallback rate');
      return data.rates.KZT;
    }
  };

  const load = async () => {
    const cached = Cache.get(CONFIG.CACHE.EXCHANGE);
    if (cached) {
      render(cached.rate, lastRate ?? cached.prev ?? null);
      lastRate = cached.rate;
      return;
    }

    try {
      const rate = await getRate();
      render(rate, lastRate);
      Cache.set(CONFIG.CACHE.EXCHANGE, { rate, prev: lastRate }, CONFIG.EXCHANGE_INTERVAL);
      lastRate = rate;
    } catch (error) {
      setText('exch-rate', '--');
      setText('exch-meta', 'RATE UNAVAILABLE');
      console.error('V1 exchange error:', error);
    }
  };

  const init = () => {
    load();
    setInterval(load, CONFIG.EXCHANGE_INTERVAL);
  };

  return { init, load };
})();

const FxChart = (() => {
  const RANGES = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let currentRange = '1W';
  let points = [];

  const cacheKey = range => `${CONFIG.CACHE.FX_HISTORY}:${range}`;

  const isoDate = date => date.toISOString().slice(0, 10);

  const formatDay = value => {
    const date = new Date(`${value}T00:00:00Z`);
    return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
  };

  const load = async range => {
    const cached = Cache.get(cacheKey(range));
    if (cached?.length) return cached;

    const to = new Date();
    const from = new Date(to.getTime() - RANGES[range] * 24 * 60 * 60 * 1000);
    const url = `https://api.frankfurter.dev/v2/rates?base=USD&quotes=KZT&from=${isoDate(from)}&to=${isoDate(to)}`;
    const data = await fetchJson(url);
    const series = data.map(item => ({ date: item.date, rate: item.rate }));
    Cache.set(cacheKey(range), series, CONFIG.FX_HISTORY_INTERVAL);
    return series;
  };

  const draw = () => {
    const canvas = $('fx-chart');
    const frame = canvas?.parentElement;
    if (!canvas || !frame) return;

    const width = frame.clientWidth;
    const height = frame.clientHeight;
    if (!width || !height) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    if (points.length < 2) return;

    const styles = getComputedStyle(document.documentElement);
    const inkColor = styles.getPropertyValue('--ink').trim() || '#11110f';
    const mutedColor = styles.getPropertyValue('--ink-muted').trim() || '#777770';
    const gridColor = styles.getPropertyValue('--line-faint').trim() || '#d2d2cb';

    const padding = { top: 14, right: 12, bottom: 24, left: 58 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const values = points.map(point => point.rate);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;

    const x = index => padding.left + (index / (points.length - 1)) * plotWidth;
    const y = rate => padding.top + (1 - (rate - min) / span) * plotHeight;

    context.strokeStyle = gridColor;
    context.lineWidth = 1;
    for (let line = 0; line <= 4; line++) {
      const lineY = padding.top + (line / 4) * plotHeight;
      context.beginPath();
      context.moveTo(padding.left, lineY);
      context.lineTo(width - padding.right, lineY);
      context.stroke();
    }

    context.strokeStyle = inkColor;
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.beginPath();
    points.forEach((point, index) => {
      const pointX = x(index);
      const pointY = y(point.rate);
      if (index === 0) context.moveTo(pointX, pointY);
      else context.lineTo(pointX, pointY);
    });
    context.stroke();

    context.fillStyle = inkColor;
    context.beginPath();
    context.arc(x(points.length - 1), y(points[points.length - 1].rate), 3.5, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = mutedColor;
    context.font = '10px "Courier New", Courier, monospace';
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    context.fillText(max.toFixed(2), padding.left - 8, padding.top);
    context.fillText(min.toFixed(2), padding.left - 8, padding.top + plotHeight);

    context.textBaseline = 'alphabetic';
    context.textAlign = 'left';
    context.fillText(formatDay(points[0].date), padding.left, height - 7);
    context.textAlign = 'right';
    context.fillText(formatDay(points[points.length - 1].date), width - padding.right, height - 7);

    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    setText('fx-low', min.toFixed(2));
    setText('fx-high', max.toFixed(2));
    setText('fx-change', `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`);
  };

  const show = async range => {
    currentRange = range;
    const empty = $('fx-chart-empty');
    try {
      points = await load(range);
      const emptyState = !points || points.length < 2;
      if (empty) empty.hidden = !emptyState;
      if (emptyState) {
        setText('fx-low', '--');
        setText('fx-high', '--');
        setText('fx-change', '--');
      }
      draw();
    } catch (error) {
      points = [];
      if (empty) empty.hidden = false;
      setText('fx-low', '--');
      setText('fx-high', '--');
      setText('fx-change', '--');
      console.error('V1 FX history error:', error);
    }
  };

  const clear = () => {
    Object.keys(RANGES).forEach(range => Cache.clear(cacheKey(range)));
  };

  const init = () => {
    show(currentRange);

    document.querySelectorAll('.chart-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.chart-tab').forEach(item => item.classList.remove('active'));
        tab.classList.add('active');
        show(tab.dataset.range);
      });
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(draw, 150);
    });
  };

  return { init, reload: () => show(currentRange), clear, draw };
})();

const SystemStatus = (() => {
  const updateNetwork = () => {
    const online = navigator.onLine;
    ['net-dot', 'net-dot2'].forEach(id => $(id)?.classList.toggle('offline', !online));
    setText('net-label', online ? 'ONLINE' : 'OFFLINE');
    setText('net-label2', online ? 'Online' : 'Offline');
    Refresh.setState(online ? 'LIVE' : 'OFFLINE');
  };

  const updateBattery = battery => {
    const percentage = Math.round(battery.level * 100);
    setText('bat-pct', `${percentage}%`);
    setText('bat-charging', battery.charging ? 'Charging' : 'On battery');
    const fill = $('bat-fill');
    if (fill) fill.style.width = `${percentage}%`;
  };

  const initBattery = async () => {
    if (!navigator.getBattery) {
      setText('bat-pct', 'N/A');
      setText('bat-charging', 'Unavailable');
      return;
    }

    try {
      const battery = await navigator.getBattery();
      updateBattery(battery);
      battery.addEventListener('levelchange', () => updateBattery(battery));
      battery.addEventListener('chargingchange', () => updateBattery(battery));
    } catch (error) {
      setText('bat-pct', 'N/A');
      setText('bat-charging', 'Unavailable');
    }
  };

  const init = () => {
    updateNetwork();
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    initBattery();
  };

  return { init };
})();

const Theme = (() => {
  const KEY = 'dash_v1_theme';
  const COLORS = { light: '#f1f1ec', dark: '#141412' };

  const read = () => {
    try {
      return localStorage.getItem(KEY);
    } catch (error) {
      return null;
    }
  };

  const apply = mode => {
    document.documentElement.dataset.theme = mode;
    const button = $('btn-theme');
    if (button) button.textContent = mode === 'dark' ? 'Light' : 'Dark';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = COLORS[mode] || COLORS.light;
    FxChart.draw();
  };

  const toggle = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(KEY, next);
    } catch (error) {}
    apply(next);
  };

  const init = () => {
    apply(read() === 'dark' ? 'dark' : 'light');
    $('btn-theme')?.addEventListener('click', toggle);
  };

  return { init };
})();

const Controls = (() => {
  const refresh = async () => {
    Refresh.setState('UPDATING');
    Cache.clear(CONFIG.CACHE.WEATHER);
    Cache.clear(CONFIG.CACHE.AQI);
    Cache.clear(CONFIG.CACHE.EXCHANGE);
    FxChart.clear();
    await Promise.all([Weather.load(), AQI.load(), Exchange.load(), FxChart.reload()]);
    Refresh.setState(navigator.onLine ? 'LIVE' : 'OFFLINE');
  };

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };

  const init = () => {
    $('btn-settings')?.addEventListener('click', () => {
      alert('Edit /v1/config.js to change API keys, location, and refresh intervals.');
    });
    $('btn-refresh')?.addEventListener('click', refresh);
    $('btn-fullscreen')?.addEventListener('click', fullscreen);
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  Clock.init();
  Weather.init();
  AQI.init();
  Exchange.init();
  FxChart.init();
  SystemStatus.init();
  Controls.init();
});
