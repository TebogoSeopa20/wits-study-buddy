// weatherUtils.js - Utility functions for weather app

// Weather API configuration
const WEATHER_API_KEY = '266ef1df752f036166fe196a91952eef';
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

// Weather icon mapping
const weatherIconMap = {
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
    '800': 'sun', // Default for clear, will be adjusted based on day/night
    
    // Clouds
    '801': 'cloud-sun',
    '802': 'cloud',
    '803': 'cloud',
    '804': 'cloud'
};

// Get user's location using geolocation API
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
        } else {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        }
    });
}

// Fetch current weather data from API
async function fetchCurrentWeather(lat, lon) {
    const url = `${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch current weather');
    }
    return await response.json();
}

// Fetch weather forecast data from API
async function fetchWeatherForecast(lat, lon) {
    const url = `${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch weather forecast');
    }
    return await response.json();
}

// Get weather icon based on weather code and time of day
function getWeatherIcon(weatherId, iconCode) {
    let iconClass = weatherIconMap[weatherId.toString()] || 'cloud';
    
    // Adjust for day/night for clear sky
    if (weatherId === 800) {
        iconClass = iconCode.endsWith('d') ? 'sun' : 'moon';
    }
    
    return `<i class="fas fa-${iconClass}"></i>`;
}

// Convert wind speed from m/s to km/h
function convertWindSpeedToKmh(windSpeedMs) {
    return Math.round(windSpeedMs * 3.6);
}

// Convert visibility from meters to kilometers
function convertVisibilityToKm(visibilityMeters) {
    return (visibilityMeters / 1000).toFixed(1);
}

// Generate study recommendations based on weather data
function generateStudyRecommendations(weatherData) {
    const temp = weatherData.main.temp;
    const weatherId = weatherData.weather[0].id;
    const humidity = weatherData.main.humidity;
    const windSpeed = convertWindSpeedToKmh(weatherData.wind.speed);
    
    let clothing = '';
    let studyTips = '';
    let hydration = '';
    
    // Temperature-based recommendations
    if (temp > 30) {
        clothing = 'Light, breathable clothing (shorts, t-shirts). Wear a hat and sunscreen.';
        studyTips = 'Find air-conditioned study spaces like the library. Study during cooler morning/evening hours.';
        hydration = 'Drink at least 3-4 liters of water today. Carry a water bottle at all times.';
    } 
    else if (temp > 20) {
        clothing = 'Comfortable summer clothes (t-shirts, light pants/skirts). Bring a light jacket for evening.';
        studyTips = 'Outdoor study in shaded areas can be pleasant. Use the campus gardens.';
        hydration = 'Drink 2-3 liters of water. Keep hydrated especially between classes.';
    }
    else if (temp > 10) {
        clothing = 'Layered clothing (light sweater/jacket over t-shirt). Comfortable pants.';
        studyTips = 'Indoor study spaces will be comfortable. Open windows for fresh air.';
        hydration = 'Drink 1.5-2 liters of water. Warm beverages can help stay hydrated.';
    }
    else {
        clothing = 'Warm winter clothing (jacket, sweater, scarf). Gloves if very cold.';
        studyTips = 'Find well-heated study spaces. Take breaks to move and warm up.';
        hydration = 'Drink warm fluids (tea, hot water). Aim for 1.5 liters minimum.';
    }
    
    // Weather condition adjustments
    if (weatherId >= 200 && weatherId < 300) {
        // Thunderstorm
        clothing += ' Waterproof jacket or umbrella essential.';
        studyTips = 'Best to study indoors today - use library or student centers. Thunderstorms may cause power fluctuations.';
    } 
    else if (weatherId >= 300 && weatherId < 600) {
        // Rain/drizzle
        clothing += ' Waterproof shoes and jacket recommended.';
        studyTips = 'Indoor study recommended. The library will be busy - arrive early to get a good spot.';
    }
    else if (weatherId >= 600 && weatherId < 700) {
        // Snow (unlikely in Johannesburg but included for completeness)
        clothing += ' Warm, waterproof boots essential. Layer up.';
        studyTips = 'Stay indoors for study. Campus may have reduced services - check announcements.';
    }
    else if (weatherId === 800) {
        // Clear sky
        if (temp > 25) {
            studyTips += ' Consider outdoor study in shaded areas - use sunscreen and find spots near buildings for WiFi.';
        }
    }
    
    // High humidity adjustment
    if (humidity > 70) {
        if (temp > 25) {
            clothing += ' Choose moisture-wicking fabrics to stay comfortable.';
            hydration += ' Extra hydration needed in humid conditions - consider electrolyte drinks.';
        } else if (temp < 15) {
            clothing += ' Wear layers you can remove as humidity makes cold feel more intense.';
        }
    }
    
    // Windy conditions
    if (windSpeed > 20) {
        clothing += ' Secure loose items - windy conditions on campus.';
        studyTips += ' Windy conditions may make outdoor study difficult - find a sheltered spot if studying outside.';
    }
    
    return { clothing, studyTips, hydration };
}

// Process forecast data to group by day and calculate averages
function processForecastData(forecastData) {
    const dailyForecasts = {};
    
    forecastData.list.forEach(item => {
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
    
    // Calculate average temperatures and return array
    return Object.values(dailyForecasts).map(day => ({
        date: day.date,
        avgTemp: day.temps.reduce((sum, temp) => sum + temp, 0) / day.temps.length,
        weather: day.weather
    }));
}

// Validate weather data structure
function validateWeatherData(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    
    const requiredFields = ['main', 'weather', 'wind', 'name', 'sys'];
    return requiredFields.every(field => data.hasOwnProperty(field));
}

// Validate forecast data structure
function validateForecastData(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    
    return data.hasOwnProperty('list') && Array.isArray(data.list);
}

// Format temperature for display
function formatTemperature(temp) {
    return Math.round(temp);
}

// Format wind speed for display
function formatWindSpeed(windSpeedMs) {
    return `${convertWindSpeedToKmh(windSpeedMs)} km/h`;
}

// Format visibility for display
function formatVisibility(visibilityMeters) {
    return `${convertVisibilityToKm(visibilityMeters)} km`;
}

module.exports = {
    getUserLocation,
    fetchCurrentWeather,
    fetchWeatherForecast,
    getWeatherIcon,
    convertWindSpeedToKmh,
    convertVisibilityToKm,
    generateStudyRecommendations,
    processForecastData,
    validateWeatherData,
    validateForecastData,
    formatTemperature,
    formatWindSpeed,
    formatVisibility,
    weatherIconMap
};