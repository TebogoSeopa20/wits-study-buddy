// Clean Weather App for Wits University - No Study Recommendations
class WeatherApp {
    constructor() {
        this.apiKey = '266ef1df752f036166fe196a91952eef';
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.errorMessage = document.getElementById('error-message');
        this.errorText = document.getElementById('error-text');
        this.closeError = document.getElementById('close-error');
        
        // Current weather elements
        this.locationElement = document.getElementById('location');
        this.currentTempElement = document.getElementById('current-temp');
        this.currentDescElement = document.getElementById('current-desc');
        this.currentIconElement = document.getElementById('current-icon');
        this.feelsLikeElement = document.getElementById('feels-like');
        this.humidityElement = document.getElementById('humidity');
        this.windElement = document.getElementById('wind');
        this.visibilityElement = document.getElementById('visibility');
        this.cloudsElement = document.getElementById('clouds');

        // Forecast container
        this.forecastContainer = document.getElementById('forecast-container');
        
        // Refresh button
        this.refreshBtn = document.getElementById('refresh-btn');
        
        // Initialize the app
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.refreshBtn.addEventListener('click', () => this.getWeather());
        this.closeError.addEventListener('click', () => this.hideError());
        
        // Get weather data
        this.getWeather();
    }
    
    async getWeather() {
        this.showLoading();
        
        try {
            // First get user's location
            const position = await this.getUserLocation();
            const { latitude, longitude } = position.coords;
            
            // Fetch current weather and forecast
            const [currentWeather, forecast] = await Promise.all([
                this.fetchCurrentWeather(latitude, longitude),
                this.fetchWeatherForecast(latitude, longitude)
            ]);
            
            // Update the UI
            this.updateCurrentWeather(currentWeather);
            this.updateForecast(forecast);
            
        } catch (error) {
            console.error('Error getting weather data:', error);
            this.showError('Failed to get weather data. Please try again.');
        } finally {
            this.hideLoading();
        }
    }
    
    getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
            } else {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            }
        });
    }
    
    async fetchCurrentWeather(lat, lon) {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch current weather');
        }
        return await response.json();
    }
    
    async fetchWeatherForecast(lat, lon) {
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch weather forecast');
        }
        return await response.json();
    }
    
    updateCurrentWeather(data) {
        // Location
        this.locationElement.textContent = `${data.name}, ${data.sys.country}`;
        
        // Temperature
        this.currentTempElement.textContent = Math.round(data.main.temp);
        
        // Weather description and icon
        const weather = data.weather[0];
        this.currentDescElement.textContent = weather.description;
        this.currentIconElement.innerHTML = this.getWeatherIcon(weather.id, weather.icon);
        
        // Details
        this.feelsLikeElement.textContent = `${Math.round(data.main.feels_like)}°C`;
        this.humidityElement.textContent = `${data.main.humidity}%`;
        this.windElement.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        this.visibilityElement.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        this.cloudsElement.textContent = `${data.clouds.all}%`;

        // Update weather animation
        this.updateWeatherAnimation(weather.id);
    }
    
    updateWeatherAnimation(weatherId) {
        const animationContainer = document.getElementById('weather-animation');
        let animationIcon = 'cloud';
        
        // Simple animation based on weather condition
        if (weatherId >= 200 && weatherId < 300) {
            animationIcon = 'bolt'; // Thunderstorm
        } else if (weatherId >= 300 && weatherId < 600) {
            animationIcon = 'cloud-rain'; // Rain
        } else if (weatherId >= 600 && weatherId < 700) {
            animationIcon = 'snowflake'; // Snow
        } else if (weatherId === 800) {
            animationIcon = 'sun'; // Clear
        } else if (weatherId > 800) {
            animationIcon = 'cloud'; // Clouds
        }
        
        animationContainer.innerHTML = `
            <div class="weather-animation">
                <i class="fas fa-${animationIcon}"></i>
            </div>
        `;
    }
    
    updateForecast(data) {
        // Clear existing forecast cards
        this.forecastContainer.innerHTML = '';
        
        // Group forecasts by day
        const dailyForecasts = {};
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            if (!dailyForecasts[day]) {
                dailyForecasts[day] = {
                    date: day,
                    temps: [],
                    weather: item.weather[0],
                    dt: item.dt
                };
            }
            
            dailyForecasts[day].temps.push(item.main.temp);
        });
        
        // Create forecast cards for the next 7 days
        const forecastDays = Object.values(dailyForecasts).slice(0, 7);
        
        forecastDays.forEach(day => {
            const avgTemp = day.temps.reduce((sum, temp) => sum + temp, 0) / day.temps.length;
            const weather = day.weather;
            
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';
            forecastCard.innerHTML = `
                <div class="forecast-day">${day.date}</div>
                <div class="forecast-icon">${this.getWeatherIcon(weather.id, weather.icon)}</div>
                <div class="forecast-temp">${Math.round(avgTemp)}°</div>
                <div class="forecast-desc">${weather.description}</div>
            `;
            
            this.forecastContainer.appendChild(forecastCard);
        });
    }
    
    getWeatherIcon(weatherId, iconCode) {
        // Map weather codes to Font Awesome icons
        const iconMap = {
            // Thunderstorm
            '200': 'bolt',
            '201': 'bolt',
            '202': 'bolt',
            '210': 'bolt',
            '211': 'bolt',
            '212': 'bolt',
            '221': 'bolt',
            '230': 'bolt',
            '231': 'bolt',
            '232': 'bolt',
            
            // Drizzle
            '300': 'cloud-rain',
            '301': 'cloud-rain',
            '302': 'cloud-rain',
            '310': 'cloud-rain',
            '311': 'cloud-rain',
            '312': 'cloud-rain',
            '313': 'cloud-rain',
            '314': 'cloud-rain',
            '321': 'cloud-rain',
            
            // Rain
            '500': 'cloud-showers-heavy',
            '501': 'cloud-showers-heavy',
            '502': 'cloud-showers-heavy',
            '503': 'cloud-showers-heavy',
            '504': 'cloud-showers-heavy',
            '511': 'snowflake',
            '520': 'cloud-rain',
            '521': 'cloud-rain',
            '522': 'cloud-rain',
            '531': 'cloud-rain',
            
            // Snow
            '600': 'snowflake',
            '601': 'snowflake',
            '602': 'snowflake',
            '611': 'snowflake',
            '612': 'snowflake',
            '613': 'snowflake',
            '615': 'snowflake',
            '616': 'snowflake',
            '620': 'snowflake',
            '621': 'snowflake',
            '622': 'snowflake',
            
            // Atmosphere
            '701': 'smog',
            '711': 'smog',
            '721': 'smog',
            '731': 'smog',
            '741': 'smog',
            '751': 'smog',
            '761': 'smog',
            '762': 'smog',
            '771': 'wind',
            '781': 'tornado',
            
            // Clear
            '800': iconCode.includes('d') ? 'sun' : 'moon',
            
            // Clouds
            '801': 'cloud-sun',
            '802': 'cloud',
            '803': 'cloud',
            '804': 'cloud'
        };
        
        const iconName = iconMap[weatherId] || 'cloud';
        return `<i class="fas fa-${iconName}"></i>`;
    }
    
    showLoading() {
        this.loadingOverlay.classList.add('active');
        this.refreshBtn.disabled = true;
    }
    
    hideLoading() {
        this.loadingOverlay.classList.remove('active');
        this.refreshBtn.disabled = false;
    }
    
    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.add('active');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }
    
    hideError() {
        this.errorMessage.classList.remove('active');
    }
}

// Initialize the weather app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Service Worker Registration for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}