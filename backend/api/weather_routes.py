import requests
import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from fastapi import APIRouter

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")

router = APIRouter()


def get_weather(city="Ho Chi Minh"):
    """Get current weather data"""
    url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?q={city}"
        f"&appid={API_KEY}"
        "&units=metric"
        "&lang=vi"
    )

    response = requests.get(url)
    return response.json()


def get_uv_index(lat, lon):
    """Get UV index for coordinates"""
    url = (
        "https://api.openweathermap.org/data/2.5/uvi"
        f"?lat={lat}"
        f"&lon={lon}"
        f"&appid={API_KEY}"
    )
    
    try:
        response = requests.get(url)
        data = response.json()
        return round(data.get("value", 0))
    except:
        return 0


def get_forecast(city="Ho Chi Minh", days=3):
    """Get weather forecast using OpenWeather 5-day API"""
    url = (
        "https://api.openweathermap.org/data/2.5/forecast"
        f"?q={city}"
        f"&appid={API_KEY}"
        "&units=metric"
        "&lang=vi"
    )
    
    response = requests.get(url)
    data = response.json()
    
  
    forecast_by_day = {}
    
    for item in data["list"]:
    
        dt = datetime.fromisoformat(item["dt_txt"])
        date_str = dt.strftime("%Y-%m-%d")
        
        # Only take noon data (12:00) to get one prediction per day
        if dt.hour == 12:
            if date_str not in forecast_by_day:
                forecast_by_day[date_str] = {
                    "temp_max": item["main"]["temp_max"],
                    "temp_min": item["main"]["temp_min"],
                    "description": item["weather"][0]["description"],
                    "icon": item["weather"][0]["icon"],
                }
    
  
    sorted_dates = sorted(forecast_by_day.keys())[:days]
    
    forecast_list = []
    for date_str in sorted_dates:
        day_data = forecast_by_day[date_str]
        forecast_list.append({
            "date": date_str,
            "temp_max": round(day_data["temp_max"]),
            "temp_min": round(day_data["temp_min"]),
            "description": day_data["description"],
            "icon": day_data["icon"],
            "icon_url": f"https://openweathermap.org/img/wn/{day_data['icon']}@4x.png"  
        })
    
    return forecast_list


@router.get("/current")
def current_weather(city: str = "Ho Chi Minh"):
    """Get current weather for a city with all details"""
    data = get_weather(city)

    icon = data["weather"][0]["icon"]
    lat = data["coord"]["lat"]
    lon = data["coord"]["lon"]
    

    uv_index = get_uv_index(lat, lon)

    return {
        "city": data["name"],
        "country": data["sys"].get("country", ""),
        "temperature": round(data["main"]["temp"], 1),
        "feels_like": round(data["main"]["feels_like"], 1),
        "humidity": data["main"]["humidity"],
        "weather": data["weather"][0]["main"],
        "description": data["weather"][0]["description"],
        "wind_speed": round(data["wind"]["speed"], 1),
        "visibility": round(data["visibility"] / 1000, 1), 
        "uv_index": uv_index,
        "icon": icon,
        "icon_url": f"https://openweathermap.org/img/wn/{icon}@4x.png"  
    }


@router.get("/forecast")
def weather_forecast(city: str = "Ho Chi Minh", days: int = 3):
    """Get weather forecast for next N days
    
    Args:
        city: City name (default: Ho Chi Minh)
        days: Number of days to forecast (1-5, default: 3)
    
    Returns:
        {
            "city": "Ho Chi Minh",
            "forecast": [
                {
                    "date": "2026-05-08",
                    "temp_max": 32,
                    "temp_min": 24,
                    "description": "Nắng",
                    "icon": "01d",
                    "icon_url": "https://..."
                },
                ...
            ]
        }
    """
   
    if days < 1 or days > 5:
        days = 3
    
    forecast = get_forecast(city, days)
    
    return {
        "city": city,
        "forecast": forecast
    }