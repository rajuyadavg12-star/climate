const form = document.getElementById('searchForm');
const errorEl = document.getElementById('error');

const weatherCodes = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow',
  75: 'Heavy snow', 80: 'Rain showers', 81: 'Heavy showers', 95: 'Thunderstorm',
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';
  const city = document.getElementById('cityInput').value.trim();
  try {
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`).then(r => r.json());
    if (!geo.results || !geo.results.length) throw new Error('City not found.');
    const { latitude, longitude, name, country } = geo.results[0];

    const [weather, air] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`).then(r => r.json()),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi`).then(r => r.json()).catch(() => null),
    ]);

    const c = weather.current;
    document.getElementById('locationName').textContent = `${name}, ${country}`;
    document.getElementById('temp').textContent = `${Math.round(c.temperature_2m)}°C`;
    document.getElementById('weatherDesc').textContent = weatherCodes[c.weather_code] || 'Unknown';
    document.getElementById('humidity').textContent = c.relative_humidity_2m;
    document.getElementById('wind').textContent = Math.round(c.wind_speed_10m);
    document.getElementById('rain').textContent = c.precipitation;
    document.getElementById('aqi').textContent = air?.current?.european_aqi ?? 'N/A';
    document.getElementById('current').classList.remove('hidden');

    const grid = document.getElementById('forecastGrid');
    grid.innerHTML = '';
    weather.daily.time.forEach((day, i) => {
      grid.innerHTML += `<div class="card"><p><strong>${new Date(day).toLocaleDateString(undefined, { weekday: 'short' })}</strong></p><p>${weatherCodes[weather.daily.weather_code[i]] || ''}</p><p>🔺 ${Math.round(weather.daily.temperature_2m_max[i])}°</p><p>🔻 ${Math.round(weather.daily.temperature_2m_min[i])}°</p></div>`;
    });
    document.getElementById('forecast').classList.remove('hidden');
  } catch (err) {
    errorEl.textContent = err.message;
  }
});
