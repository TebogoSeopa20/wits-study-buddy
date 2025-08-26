// weatherUtils.test.js - Tests for weather utility functions
const {
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
} = require('../src/frontend/test_utils/weatherUtils');

// Mock fetch for API tests
global.fetch = jest.fn();

describe('Weather Utility Functions', () => {
    describe('getUserLocation', () => {
        beforeEach(() => {
            // Mock geolocation
            global.navigator.geolocation = {
                getCurrentPosition: jest.fn()
            };
        });

        test('resolves with position when geolocation is supported', () => {
            const mockPosition = { coords: { latitude: -26.191, longitude: 28.031 } };
            navigator.geolocation.getCurrentPosition.mockImplementation((success) => success(mockPosition));

            return expect(getUserLocation()).resolves.toEqual(mockPosition);
        });

        test('rejects when geolocation is not supported', () => {
            delete global.navigator.geolocation;

            return expect(getUserLocation()).rejects.toThrow('Geolocation is not supported by your browser');
        });

        test('rejects when geolocation fails', () => {
            navigator.geolocation.getCurrentPosition.mockImplementation((success, error) => error(new Error('Permission denied')));

            return expect(getUserLocation()).rejects.toThrow('Permission denied');
        });
    });

    describe('API fetch functions', () => {
        beforeEach(() => {
            fetch.mockClear();
        });

        test('fetchCurrentWeather calls correct API endpoint', async () => {
            const mockResponse = { ok: true, json: () => Promise.resolve({}) };
            fetch.mockResolvedValue(mockResponse);

            await fetchCurrentWeather(-26.191, 28.031);

            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('https://api.openweathermap.org/data/2.5/weather'));
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('lat=-26.191'));
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('lon=28.031'));
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('units=metric'));
        });

        test('fetchWeatherForecast calls correct API endpoint', async () => {
            const mockResponse = { ok: true, json: () => Promise.resolve({}) };
            fetch.mockResolvedValue(mockResponse);

            await fetchWeatherForecast(-26.191, 28.031);

            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('https://api.openweathermap.org/data/2.5/forecast'));
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('lat=-26.191'));
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('lon=28.031'));
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('units=metric'));
        });

        test('fetch functions throw error when response is not ok', async () => {
            const mockResponse = { ok: false };
            fetch.mockResolvedValue(mockResponse);

            await expect(fetchCurrentWeather(-26.191, 28.031)).rejects.toThrow('Failed to fetch current weather');
            await expect(fetchWeatherForecast(-26.191, 28.031)).rejects.toThrow('Failed to fetch weather forecast');
        });
    });

    describe('getWeatherIcon', () => {
        test('returns correct icon for thunderstorm', () => {
            expect(getWeatherIcon(200, '01d')).toContain('fa-bolt');
            expect(getWeatherIcon(212, '01d')).toContain('fa-bolt');
        });

        test('returns correct icon for rain', () => {
            expect(getWeatherIcon(500, '01d')).toContain('fa-cloud-showers-heavy');
            expect(getWeatherIcon(501, '01d')).toContain('fa-cloud-showers-heavy');
        });

        test('returns correct icon for clear sky (day)', () => {
            expect(getWeatherIcon(800, '01d')).toContain('fa-sun');
        });

        test('returns correct icon for clear sky (night)', () => {
            expect(getWeatherIcon(800, '01n')).toContain('fa-moon');
        });

        test('returns cloud icon for unknown weather code', () => {
            expect(getWeatherIcon(999, '01d')).toContain('fa-cloud');
        });
    });

    describe('conversion functions', () => {
        test('convertWindSpeedToKmh converts correctly', () => {
            expect(convertWindSpeedToKmh(5)).toBe(18); // 5 m/s = 18 km/h
            expect(convertWindSpeedToKmh(10)).toBe(36); // 10 m/s = 36 km/h
            expect(convertWindSpeedToKmh(2.5)).toBe(9); // 2.5 m/s = 9 km/h (rounded)
        });

        test('convertVisibilityToKm converts correctly', () => {
            expect(convertVisibilityToKm(5000)).toBe('5.0'); // 5000m = 5.0km
            expect(convertVisibilityToKm(10000)).toBe('10.0'); // 10000m = 10.0km
            expect(convertVisibilityToKm(2500)).toBe('2.5'); // 2500m = 2.5km
        });
    });

    describe('generateStudyRecommendations', () => {
        const mockWeatherData = {
            main: {
                temp: 25,
                humidity: 60,
                feels_like: 26
            },
            weather: [{ id: 800 }],
            wind: { speed: 3 }
        };

        test('generates recommendations for hot weather', () => {
            const hotWeather = {
                ...mockWeatherData,
                main: { ...mockWeatherData.main, temp: 32, humidity: 70 }
            };

            const recommendations = generateStudyRecommendations(hotWeather);
            
            expect(recommendations.clothing).toContain('Light, breathable clothing');
            expect(recommendations.studyTips).toContain('air-conditioned study spaces');
            expect(recommendations.hydration).toContain('3-4 liters of water');
        });

        test('generates recommendations for cold weather', () => {
            const coldWeather = {
                ...mockWeatherData,
                main: { ...mockWeatherData.main, temp: 5, humidity: 80 }
            };

            const recommendations = generateStudyRecommendations(coldWeather);
            
            expect(recommendations.clothing).toContain('Warm winter clothing');
            expect(recommendations.studyTips).toContain('well-heated study spaces');
            expect(recommendations.hydration).toContain('warm fluids');
        });

        test('includes rain-specific recommendations', () => {
            const rainyWeather = {
                ...mockWeatherData,
                weather: [{ id: 500 }],
                main: { ...mockWeatherData.main, temp: 18 }
            };

            const recommendations = generateStudyRecommendations(rainyWeather);
            
            expect(recommendations.clothing).toContain('Waterproof shoes');
            expect(recommendations.studyTips).toContain('Indoor study recommended');
        });

        test('includes humidity adjustments', () => {
            const humidWeather = {
                ...mockWeatherData,
                main: { ...mockWeatherData.main, temp: 28, humidity: 85 }
            };

            const recommendations = generateStudyRecommendations(humidWeather);
            
            expect(recommendations.clothing).toContain('moisture-wicking fabrics');
            expect(recommendations.hydration).toContain('electrolyte drinks');
        });
    });

    describe('processForecastData', () => {
        const mockForecastData = {
            list: [
                {
                    dt: 1700000000, // Monday
                    main: { temp: 20 },
                    weather: [{ id: 800, description: 'clear sky' }]
                },
                {
                    dt: 1700086400, // Tuesday
                    main: { temp: 22 },
                    weather: [{ id: 801, description: 'few clouds' }]
                },
                {
                    dt: 1700172800, // Wednesday
                    main: { temp: 18 },
                    weather: [{ id: 500, description: 'light rain' }]
                }
            ]
        };

        test('groups forecast data by day', () => {
            const result = processForecastData(mockForecastData);
            
            expect(result).toHaveLength(3);
            expect(result[0]).toHaveProperty('date');
            expect(result[0]).toHaveProperty('avgTemp');
            expect(result[0]).toHaveProperty('weather');
        });

        test('calculates correct average temperatures', () => {
            // Add multiple entries for the same day
            const multiDayForecast = {
                list: [
                    { dt: 1700000000, main: { temp: 10 }, weather: [{ id: 800 }] },
                    { dt: 1700003600, main: { temp: 12 }, weather: [{ id: 800 }] },
                    { dt: 1700007200, main: { temp: 14 }, weather: [{ id: 800 }] },
                    { dt: 1700090800, main: { temp: 20 }, weather: [{ id: 801 }] }
                ]
            };

            const result = processForecastData(multiDayForecast);
            
            // First day should have average of (10 + 12 + 14) / 3 = 12
            expect(result[0].avgTemp).toBeCloseTo(12);
            // Second day should have average of 20
            expect(result[1].avgTemp).toBe(20);
        });
    });

    describe('validation functions', () => {
        const validWeatherData = {
            main: { temp: 25, humidity: 60 },
            weather: [{ id: 800 }],
            wind: { speed: 3 },
            name: 'Johannesburg',
            sys: { country: 'ZA' }
        };

        const validForecastData = {
            list: [
                { dt: 1700000000, main: { temp: 20 }, weather: [{ id: 800 }] }
            ]
        };

        test('validateWeatherData returns true for valid data', () => {
            expect(validateWeatherData(validWeatherData)).toBe(true);
        });

        test('validateWeatherData returns false for invalid data', () => {
            expect(validateWeatherData(null)).toBe(false);
            expect(validateWeatherData({})).toBe(false);
            expect(validateWeatherData({ main: {} })).toBe(false);
        });

        test('validateForecastData returns true for valid data', () => {
            expect(validateForecastData(validForecastData)).toBe(true);
        });

        test('validateForecastData returns false for invalid data', () => {
            expect(validateForecastData(null)).toBe(false);
            expect(validateForecastData({})).toBe(false);
            expect(validateForecastData({ list: 'not array' })).toBe(false);
        });
    });

    describe('formatting functions', () => {
        test('formatTemperature rounds temperatures correctly', () => {
            expect(formatTemperature(25.6)).toBe(26);
            expect(formatTemperature(25.4)).toBe(25);
            expect(formatTemperature(-5.7)).toBe(-6);
        });

        test('formatWindSpeed formats correctly', () => {
            expect(formatWindSpeed(5)).toBe('18 km/h');
            expect(formatWindSpeed(10)).toBe('36 km/h');
        });

        test('formatVisibility formats correctly', () => {
            expect(formatVisibility(5000)).toBe('5.0 km');
            expect(formatVisibility(10000)).toBe('10.0 km');
        });
    });

    describe('weatherIconMap', () => {
        test('contains expected weather icons', () => {
            expect(weatherIconMap['200']).toBe('bolt');
            expect(weatherIconMap['500']).toBe('cloud-showers-heavy');
            expect(weatherIconMap['800']).toBe('sun');
            expect(weatherIconMap['801']).toBe('cloud-sun');
        });
    });
});