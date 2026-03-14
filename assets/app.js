// ─────────────────────────────────────────────────────
//  app.js  —  Skye weather app logic
// ─────────────────────────────────────────────────────

const API_BASE = "https://api.weatherapi.com/v1";

// ── Weather background icons ───────────────────────────
const CONDITION_MAP = [
  { match: ["thunder", "storm"],              emoji: "⛈", count: 18 },
  { match: ["blizzard", "blowing snow"],      emoji: "❄",  count: 22 },
  { match: ["snow", "sleet", "ice", "freez"], emoji: "🌨", count: 22 },
  { match: ["heavy rain", "torrential"],      emoji: "🌧", count: 20 },
  { match: ["drizzle", "light rain"],         emoji: "🌦", count: 20 },
  { match: ["rain", "shower"],                emoji: "🌧", count: 20 },
  { match: ["fog", "mist", "haze"],           emoji: "🌫", count: 16 },
  { match: ["overcast"],                      emoji: "☁",  count: 18 },
  { match: ["cloudy", "cloud"],               emoji: "⛅", count: 18 },
  { match: ["sunny", "clear"],                emoji: "☀",  count: 16 },
  { match: [],                                emoji: "🌤", count: 16 }, // fallback
];

function getConditionEmoji(conditionText) {
  const lower = conditionText.toLowerCase();
  for (const rule of CONDITION_MAP) {
    if (rule.match.length === 0 || rule.match.some((kw) => lower.includes(kw))) {
      return { emoji: rule.emoji, count: rule.count };
    }
  }
  return { emoji: "🌤", count: 16 };
}

// Pastel color palettes per condition type
const PASTEL_PALETTES = {
  thunder:  ["#c9b8f5","#b8c8f5","#d4b8f5","#b8d4f5","#e0b8f5"],
  snow:     ["#c8e8ff","#d8f0ff","#b8dcff","#e8f4ff","#cce4ff"],
  rain:     ["#a8d8f0","#b8e4f8","#90c8e8","#c4eaf8","#98d0ec"],
  fog:      ["#d0d8e8","#c8d4e4","#dce4f0","#c0ccdc","#d8e0ec"],
  cloud:    ["#e8dff8","#ddd8f0","#f0e8fc","#d8d0ec","#ece4f8"],
  sunny:    ["#ffd8a0","#ffe4b0","#ffcc90","#ffecc0","#ffd498"],
  default:  ["#d0e8f8","#e8d0f8","#d0f8e8","#f8e8d0","#f8d0e8"],
};

function getPastelPalette(conditionText) {
  const lower = conditionText.toLowerCase();
  if (lower.includes("thunder") || lower.includes("storm"))        return PASTEL_PALETTES.thunder;
  if (lower.includes("snow") || lower.includes("sleet") || lower.includes("ice") || lower.includes("blizzard")) return PASTEL_PALETTES.snow;
  if (lower.includes("rain") || lower.includes("drizzle") || lower.includes("shower")) return PASTEL_PALETTES.rain;
  if (lower.includes("fog") || lower.includes("mist") || lower.includes("haze"))       return PASTEL_PALETTES.fog;
  if (lower.includes("cloud") || lower.includes("overcast"))       return PASTEL_PALETTES.cloud;
  if (lower.includes("sunny") || lower.includes("clear"))          return PASTEL_PALETTES.sunny;
  return PASTEL_PALETTES.default;
}

function spawnBgIcons(conditionText, isDay) {
  // Remove old layer
  const old = document.getElementById("bg-icons-layer");
  if (old) old.remove();

  const { emoji, count } = getConditionEmoji(conditionText);
  const palette = getPastelPalette(conditionText);

  const layer = document.createElement("div");
  layer.id = "bg-icons-layer";
  document.body.appendChild(layer);

  for (let i = 0; i < count; i++) {
    const span = document.createElement("span");
    span.textContent = emoji;
    span.className = "bg-icon";

    const size     = 28 + Math.random() * 52;         // 28–80px
    const x        = Math.random() * 100;             // % from left
    const delay    = -(Math.random() * 5);            // negative delay = already mid-fall on load
    const duration = 4 + Math.random() * 5;           // faster: 4–9s (was 10–24s)
    const opacity  = 0.30 + Math.random() * 0.45;     // more visible for pastel glow
    const color    = palette[i % palette.length];
    const glowSize = Math.round(size * 0.5);

    span.style.cssText = `
      left: ${x}%;
      font-size: ${size}px;
      opacity: ${opacity};
      animation-delay: ${delay}s;
      animation-duration: ${duration}s;
      color: ${color};
      filter: drop-shadow(0 0 ${glowSize}px ${color});
    `;
    layer.appendChild(span);
  }

  // Night tint
  document.body.classList.toggle("bg-night", !isDay);
}

// ── DOM refs ──────────────────────────────────────────
const form         = document.getElementById("search-form");
const input        = document.getElementById("location-input");
const stateIdle    = document.getElementById("state-idle");
const stateLoading = document.getElementById("state-loading");
const stateError   = document.getElementById("state-error");
const stateResult  = document.getElementById("state-result");
const errorMsg     = document.getElementById("error-msg");

// ── State helpers ─────────────────────────────────────
function showState(which) {
  [stateIdle, stateLoading, stateError, stateResult].forEach((el) =>
    el.classList.toggle("hidden", el !== which)
  );
}

// ── Fetch ─────────────────────────────────────────────
async function fetchWeather(query) {
  const key = CONFIG.WEATHER_API_KEY;
  if (!key || key === "YOUR_API_KEY_HERE") {
    throw new Error(
      "No API key found. Add your WeatherAPI.com key in assets/config.js"
    );
  }
  const url = `${API_BASE}/forecast.json?key=${key}&q=${encodeURIComponent(
    query
  )}&days=7&aqi=no&alerts=no`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.error?.message || `Request failed (${res.status})`
    );
  }
  return res.json();
}

// ── Render ────────────────────────────────────────────
function render(data) {
  const { location, current, forecast } = data;
  const today = forecast.forecastday[0];

  // Current
  document.getElementById("city-name").textContent    = location.name;
  document.getElementById("country-name").textContent = location.country;
  document.getElementById("temp-value").textContent   = Math.round(current.temp_c);
  document.getElementById("feels-like").textContent   = Math.round(current.feelslike_c);
  document.getElementById("condition-text").textContent = current.condition.text;
  document.getElementById("temp-max").textContent     = Math.round(today.day.maxtemp_c);
  document.getElementById("temp-min").textContent     = Math.round(today.day.mintemp_c);
  document.getElementById("meta-wind").textContent    = `${current.wind_kph} km/h ${current.wind_dir}`;
  document.getElementById("meta-humidity").textContent = `${current.humidity}% humidity`;
  document.getElementById("meta-uv").textContent      = `UV ${current.uv}`;

  // Icon
  const icon = document.getElementById("weather-icon");
  icon.src = "https:" + current.condition.icon.replace("64x64", "128x128");
  icon.alt = current.condition.text;

  // Local time
  const localDt = new Date(location.localtime);
  document.getElementById("local-time").textContent = localDt.toLocaleTimeString(
    [], { hour: "2-digit", minute: "2-digit" }
  ) + " local";

  // Apply day/night class
  const card = document.getElementById("current-card");
  card.classList.toggle("is-night", current.is_day === 0);

  // Spawn background weather icons
  spawnBgIcons(current.condition.text, current.is_day === 1);

  // 7-day forecast
  const grid = document.getElementById("forecast-grid");
  grid.innerHTML = "";
  forecast.forecastday.forEach((day) => {
    const d      = new Date(day.date + "T12:00:00");
    const label  = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    const el     = document.createElement("div");
    el.className = "forecast-day";
    el.innerHTML = `
      <span class="fd-label">${label}</span>
      <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" />
      <span class="fd-desc">${day.day.condition.text}</span>
      <div class="fd-range">
        <span class="fd-hi">${Math.round(day.day.maxtemp_c)}°</span>
        <div class="fd-bar-bg"><div class="fd-bar" style="--pct:${Math.round(
          ((day.day.maxtemp_c - day.day.mintemp_c) / 30) * 100
        )}%"></div></div>
        <span class="fd-lo">${Math.round(day.day.mintemp_c)}°</span>
      </div>
      <span class="fd-rain">${day.day.daily_chance_of_rain}% rain</span>`;
    grid.appendChild(el);
  });

  // Hourly (today)
  const scroll = document.getElementById("hourly-scroll");
  scroll.innerHTML = "";
  today.hour.forEach((h) => {
    const time = new Date(h.time).toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit",
    });
    const el   = document.createElement("div");
    el.className = "hourly-item";
    el.innerHTML = `
      <span class="hr-time">${time}</span>
      <img src="https:${h.condition.icon}" alt="" />
      <span class="hr-temp">${Math.round(h.temp_c)}°</span>
      <span class="hr-rain">${h.chance_of_rain}%</span>`;
    scroll.appendChild(el);
  });

  showState(stateResult);
}

// ── Search ────────────────────────────────────────────
async function search(query) {
  if (!query.trim()) return;
  showState(stateLoading);
  try {
    const data = await fetchWeather(query);
    render(data);
  } catch (err) {
    errorMsg.textContent = err.message;
    showState(stateError);
  }
}

// ── Events ────────────────────────────────────────────
form.addEventListener("submit", (e) => {
  e.preventDefault();
  search(input.value);
});

// Try to get geolocation on load
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const q = `${pos.coords.latitude},${pos.coords.longitude}`;
      search(q);
    },
    () => {} // silently fail — user can type manually
  );
}