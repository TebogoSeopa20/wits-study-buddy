// Weather App for Wits University - Tutor Edition
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

        // Add tutor recommendations
        this.addTutorRecommendations(data);
    }
    
    addTutorRecommendations(weatherData) {
        const recommendationsContainer = document.getElementById('recommendations-container') || 
            this.createRecommendationsContainer();
        
        const temp = weatherData.main.temp;
        const weatherId = weatherData.weather[0].id;
        const humidity = weatherData.main.humidity;
        const windSpeed = weatherData.wind.speed * 3.6; // Convert to km/h
        
        let attire = '';
        let sessionTips = '';
        let healthAdvice = '';
        
        // Temperature-based recommendations
        if (temp > 30) {
            attire = 'Light, professional attire (breathable fabrics). Consider a sunhat if conducting outdoor sessions.';
            sessionTips = 'Schedule intensive sessions for cooler morning hours. Use air-conditioned spaces and ensure proper ventilation.';
            healthAdvice = 'Stay hydrated (3-4L water). Keep electrolyte supplements handy during long sessions.';
        } 
        else if (temp > 20) {
            attire = 'Smart casual with light layers. Comfortable yet professional footwear for campus movement.';
            sessionTips = 'Ideal for outdoor tutorials in shaded areas. Consider open-air classrooms for engagement.';
            healthAdvice = 'Maintain 2-3L water intake. Use sunscreen if conducting outdoor sessions.';
        }
        else if (temp > 10) {
            attire = 'Professional layered clothing (blazer/cardigan over shirt). Comfortable indoor shoes.';
            sessionTips = 'Perfect for extended indoor sessions. Moderate room temperature helps maintain focus.';
            healthAdvice = '1.5-2L water intake. Warm beverages can help maintain vocal clarity.';
        }
        else {
            attire = 'Warm professional attire (wool blends, thermal layers). Warm footwear essential.';
            sessionTips = 'Schedule breaks to allow students to warm up. Use well-heated tutorial rooms.';
            healthAdvice = 'Warm fluids (herbal teas) to maintain health. Consider shorter sessions to prevent fatigue.';
        }
        
        // Weather condition adjustments
        if (weatherId >= 200 && weatherId < 300) {
            // Thunderstorm
            attire += ' Waterproof professional footwear recommended.';
            sessionTips = 'Prepare backup digital materials in case of power outages. Use ground-floor tutorial rooms.';
        } 
        else if (weatherId >= 300 && weatherId < 600) {
            // Rain/drizzle
            attire += ' Waterproof bag for teaching materials essential.';
            sessionTips = 'Anticipate late arrivals - plan flexible session starts. Use well-lit spaces to combat gloomy conditions.';
        }
        else if (weatherId === 800) {
            // Clear sky
            if (temp > 25) {
                sessionTips += ' Consider outdoor teaching spaces with proper shade and seating.';
            }
        }
        
        // High humidity adjustment
        if (humidity > 70) {
            if (temp > 25) {
                attire += ' Choose moisture-wicking professional fabrics.';
                healthAdvice += ' Use a portable fan in non-AC spaces.';
            }
        }
        
        // Windy conditions
        if (windSpeed > 20) {
            attire += ' Secure loose papers and materials.';
            sessionTips += ' Wind noise may affect audio quality - consider indoor spaces for online sessions.';
        }
        
        // Create recommendations HTML
        recommendationsContainer.innerHTML = `
            <h3 style="color: var(--study-blue);"><i class="fas fa-chalkboard-teacher" style="color: var(--study-gold);"></i> Tutor Recommendations</h3>
            <div class="recommendation-card">
                <h4><i class="fas fa-tshirt"></i> Professional Attire</h4>
                <p>${attire}</p>
            </div>
            <div class="recommendation-card">
                <h4><i class="fas fa-users"></i> Session Planning</h4>
                <p>${sessionTips}</p>
            </div>
            <div class="recommendation-card">
                <h4><i class="fas fa-heartbeat"></i> Health & Comfort</h4>
                <p>${healthAdvice}</p>
            </div>
        `;
    }
    
    createRecommendationsContainer() {
        const container = document.createElement('div');
        container.id = 'recommendations-container';
        container.className = 'recommendations-container';
        
        // Insert after the current weather section
        const weatherContainer = document.querySelector('.weather-container');
        weatherContainer.appendChild(container);
        
        return container;
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
            '800': iconCode.endsWith('d') ? 'sun' : 'moon',
            
            // Clouds
            '801': 'cloud-sun',
            '802': 'cloud',
            '803': 'cloud',
            '804': 'cloud'
        };
        
        const iconClass = iconMap[weatherId.toString()] || 'cloud';
        return `<i class="fas fa-${iconClass}"></i>`;
    }
    
    showLoading() {
        this.loadingOverlay.classList.add('active');
    }
    
    hideLoading() {
        this.loadingOverlay.classList.remove('active');
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
    const weatherApp = new WeatherApp();
});