export interface WeatherResult {
    location: string;
    latitude: number;
    longitude: number;
    temperature: number;
    windSpeed: number;
    weatherCode: number;
}

interface GeocodingResponse {
    results?: Array<{
        name: string;
        latitude: number;
        longitude: number;
        country: string;
    }>;
}

interface WeatherResponse {
    current?: {
        temperature_2m: number;
        wind_speed_10m: number;
        weather_code: number;
    };
}

export async function getWeather(
    location: string
): Promise<WeatherResult> {

    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`)
    if(!geoResponse.ok) {
        throw new Error("Failed to find location");
    }

    const geoData = (await geoResponse.json()) as GeocodingResponse

    const place = geoData.results?.[0]
    if(!place) {
        throw new Error(`Location not found: ${location}`)
    }
    const weatherRespnse = await fetch(`https://api.open-meteo.com/v1/forecast` +
        `?latitude=${place.latitude}` +
        `&longitude=${place.longitude}` +
        `&current=temperature_2m,wind_speed_10m,weather_code`
    )
    if(!weatherRespnse.ok) {
        throw new Error("Failed to fetch weather")
    }

    const weatherData = (await weatherRespnse.json()) as WeatherResponse
    if(!weatherData.current) {
        throw new Error("Weather data unavailable")
    }


     return {
        location: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        temperature: weatherData.current.temperature_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        weatherCode: weatherData.current.weather_code,
    };
}