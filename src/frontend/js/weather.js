// Weather functionality for student dashboard
class WeatherForecast {
    constructor() {
        this.apiKey = 'apikey'; // Replace with your OpenWeatherMap API key
        this.currentLocationElement = document.querySelector('.current-location');
        this.currentTempElement = document.querySelector('.current-temp');
        this.currentDescElement = document.querySelector('.current-description');
        this.currentIconElement = document.querySelector('.current-weather-icon i');
        this.detailValues = document.querySelectorAll('.detail-value');
        this.forecastGrid = document.querySelector('.forecast-grid');
        
        this.init();
    }

    async init() {
        try {
            await this.getCurrentLocation();
        } catch (error) {
            console.error('Error getting location:', error);
            this.showDemoWeather();
        }
    }

    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    await this.fetchWeatherData(latitude, longitude);
                    resolve();
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    this.showDemoWeather();
                    resolve();
                },
                { timeout: 10000 }
            );
        });
    }

    async fetchWeatherData(lat, lon) {
        try {
            // Note: This is a demo implementation
            // In production, you would make actual API calls to OpenWeatherMap
            // const currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`);
            // const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`);
            
            // For demo purposes, showing sample data
            this.showDemoWeather();
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showDemoWeather();
        }
    }

    showDemoWeather() {
        // Demo current weather data
        const currentWeather = {
            location: 'Johannesburg, ZA',
            temperature: 24,
            description: 'partly cloudy',
            icon: 'fas fa-cloud-sun',
            visibility: 10,
            humidity: 65,
            windSpeed: 12
        };

        // Demo 7-day forecast
        const forecast = [
            { day: 'Today', icon: 'fas fa-cloud-sun', high: 24, low: 16, desc: 'Partly Cloudy' },
            { day: 'Tomorrow', icon: 'fas fa-sun', high: 27, low: 18, desc: 'Sunny' },
            { day: 'Wednesday', icon: 'fas fa-cloud-rain', high: 21, low: 14, desc: 'Light Rain' },
            { day: 'Thursday', icon: 'fas fa-cloud', high: 19, low: 12, desc: 'Cloudy' },
            { day: 'Friday', icon: 'fas fa-sun', high: 26, low: 17, desc: 'Sunny' },
            { day: 'Saturday', icon: 'fas fa-cloud-sun', high: 25, low: 16, desc: 'Partly Cloudy' },
            { day: 'Sunday', icon: 'fas fa-cloud-rain', high: 22, low: 15, desc: 'Showers' }
        ];

        this.updateCurrentWeather(currentWeather);
        this.updateForecast(forecast);
    }

    updateCurrentWeather(data) {
        if (this.currentLocationElement) {
            this.currentLocationElement.textContent = data.location;
        }
        
        if (this.currentTempElement) {
            this.currentTempElement.textContent = `${data.temperature}°C`;
        }
        
        if (this.currentDescElement) {
            this.currentDescElement.textContent = data.description;
        }
        
        if (this.currentIconElement) {
            this.currentIconElement.className = data.icon;
        }

        // Update detail values
        if (this.detailValues.length >= 3) {
            this.detailValues[0].textContent = `${data.visibility} km`;
            this.detailValues[1].textContent = `${data.humidity}%`;
            this.detailValues[2].textContent = `${data.windSpeed} km/h`;
        }
    }

    updateForecast(forecastData) {
        if (!this.forecastGrid) return;

        this.forecastGrid.innerHTML = '';

        forecastData.forEach((day, index) => {
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';
            forecastCard.style.animationDelay = `${index * 0.1}s`;
            
            forecastCard.innerHTML = `
                <div class="forecast-day">${day.day}</div>
                <div class="forecast-icon">
                    <i class="${day.icon}"></i>
                </div>
                <div class="forecast-temps">
                    <span class="temp-high">${day.high}°</span>
                    <span class="temp-low">${day.low}°</span>
                </div>
                <div class="forecast-desc">${day.desc}</div>
            `;

            this.forecastGrid.appendChild(forecastCard);
        });

        // Add fade-in animation
        setTimeout(() => {
            document.querySelectorAll('.forecast-card').forEach(card => {
                card.classList.add('fade-in');
            });
        }, 100);
    }

    // Method to update with real API data (for future implementation)
    async fetchRealWeatherData(lat, lon, apiKey) {
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

        try {
            const [currentResponse, forecastResponse] = await Promise.all([
                fetch(currentUrl),
                fetch(forecastUrl)
            ]);

            const currentData = await currentResponse.json();
            const forecastData = await forecastResponse.json();

            const processedCurrent = {
                location: `${currentData.name}, ${currentData.sys.country}`,
                temperature: Math.round(currentData.main.temp),
                description: currentData.weather[0].description,
                icon: this.getWeatherIcon(currentData.weather[0].icon),
                visibility: Math.round(currentData.visibility / 1000),
                humidity: currentData.main.humidity,
                windSpeed: Math.round(currentData.wind.speed * 3.6)
            };

            const processedForecast = this.processForecastData(forecastData.list);

            this.updateCurrentWeather(processedCurrent);
            this.updateForecast(processedForecast);

        } catch (error) {
            console.error('Error fetching real weather data:', error);
            this.showDemoWeather();
        }
    }

    getWeatherIcon(iconCode) {
        const iconMap = {
            '01d': 'fas fa-sun',
            '01n': 'fas fa-moon',
            '02d': 'fas fa-cloud-sun',
            '02n': 'fas fa-cloud-moon',
            '03d': 'fas fa-cloud',
            '03n': 'fas fa-cloud',
            '04d': 'fas fa-cloud',
            '04n': 'fas fa-cloud',
            '09d': 'fas fa-cloud-rain',
            '09n': 'fas fa-cloud-rain',
            '10d': 'fas fa-cloud-sun-rain',
            '10n': 'fas fa-cloud-moon-rain',
            '11d': 'fas fa-bolt',
            '11n': 'fas fa-bolt',
            '13d': 'fas fa-snowflake',
            '13n': 'fas fa-snowflake',
            '50d': 'fas fa-smog',
            '50n': 'fas fa-smog'
        };
        return iconMap[iconCode] || 'fas fa-cloud';
    }

    processForecastData(forecastList) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dailyData = {};

        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();

            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {
                    day: date.getDate() === new Date().getDate() ? 'Today' : 
                         date.getDate() === new Date().getDate() + 1 ? 'Tomorrow' :
                         days[date.getDay()],
                    temps: [],
                    weather: item.weather[0],
                    date: date
                };
            }

            dailyData[dayKey].temps.push(item.main.temp);
        });

        return Object.values(dailyData).slice(0, 7).map(day => ({
            day: day.day,
            icon: this.getWeatherIcon(day.weather.icon),
            high: Math.round(Math.max(...day.temps)),
            low: Math.round(Math.min(...day.temps)),
            desc: day.weather.description
        }));
    }
}

// Initialize weather forecast when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherForecast();
});