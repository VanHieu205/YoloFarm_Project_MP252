import joblib
import pandas as pd
import datetime
import os

class YieldPredictor:
    def __init__(self, models_dir=None):
        if models_dir is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(os.path.dirname(current_dir))
            models_dir = os.path.join(project_root, 'ML', 'models')

        if not os.path.exists(models_dir):
            raise FileNotFoundError(f"Models directory not found: {os.path.abspath(models_dir)}")

        self.model = joblib.load(os.path.join(models_dir, 'xgb_crop_yield_model.pkl'))
        self.features = joblib.load(os.path.join(models_dir, 'model_features.pkl'))
        self.base_yield_dict = joblib.load(os.path.join(models_dir, 'crop_base_yield_dict.pkl'))

        self.vn_base_yields = {
            'rice': 6500.0,
            'maize': 5000.0,
            'sugarcane': 65000.0
        }

        self.unit_to_kg_multiplier = {
            'cotton(lint)': 170.0,
            'jute': 180.0,
            'mesta': 180.0,
            'coconut': 1.2
        }

        self.whole_year_crops = {
            'sugarcane', 'coconut', 'arecanut', 'black pepper', 
            'banana', 'grapes', 'mango', 'orange', 'papaya', 
            'onion', 'potato', 'sweet potato',
            'cashewnut', 'citrus fruit', 'other fresh fruits', 
            'pome fruit', 'pome granet', 'sapota', 'pineapple', 
            'garlic', 'ginger', 'dry ginger', 'turmeric'
        }

        self.vn_to_in_season = {
            'đông xuân': 'rabi',
            'hè thu': 'kharif',
            'thu đông': 'autumn',
            'mùa đông': 'winter',
            'mùa khô': 'summer',
            'mùa mưa': 'kharif'
        }

        self.in_to_vn_display = {
            'kharif': 'Mùa mưa / Hè Thu',
            'rabi': 'Mùa khô / Đông Xuân',
            'autumn': 'Thu Đông',
            'winter': 'Mùa Đông',
            'summer': 'Mùa Khô',
            'whole year': 'Quanh năm'
        }

    def _get_realtime_vn_season(self):
        month = datetime.datetime.now().month
        
        if month in [11, 12, 1, 2, 3]:
            return 'rabi' 
        elif month in [4, 5, 6, 7, 8]:
            return 'kharif'
        else:
            return 'autumn'

    def predict_realtime(self, temp, humid, soil_moist, crop_name, manual_season=None, use_vn_base=True):
        crop_name = crop_name.strip().lower()

        if manual_season:
            season_input = manual_season.strip().lower()
            season = self.vn_to_in_season.get(season_input, season_input)
        else:
            if crop_name in self.whole_year_crops:
                season = 'whole year'
            else:
                season = self._get_realtime_vn_season()

        data_quality = "authentic"
        
        if temp is None or not (-10 <= temp <= 60): 
            temp = 28.0
            data_quality = "imputed_warning"
        if humid is None or not (0 <= humid <= 100): 
            humid = 75.0
            data_quality = "imputed_warning"
        if soil_moist is None or not (0 <= soil_moist <= 100): 
            soil_moist = 50.0
            data_quality = "imputed_warning"

        input_data = pd.DataFrame(0.0, index=[0], columns=self.features)

        if 'Temperature' in self.features: input_data['Temperature'] = temp
        if 'Humidity' in self.features: input_data['Humidity'] = humid
        if 'Soil_Moisture' in self.features: input_data['Soil_Moisture'] = soil_moist

        if 'Temp_Humid_Index' in self.features: input_data['Temp_Humid_Index'] = temp * humid
        if 'Soil_Temp_Ratio' in self.features: input_data['Soil_Temp_Ratio'] = soil_moist / (temp + 1)
        if 'Temp_Stress' in self.features: input_data['Temp_Stress'] = (temp - 25) ** 2
        if 'Humid_Stress' in self.features: input_data['Humid_Stress'] = (humid - 60) ** 2

        indian_base = self.base_yield_dict.get(crop_name, 0.0)
        if 'Crop_Base_Yield' in self.features:
            input_data['Crop_Base_Yield'] = indian_base

        crop_col = f'Crop_{crop_name}'
        if crop_col in self.features: input_data[crop_col] = 1.0

        season_col = f'Season_{season}'
        if season_col in self.features: input_data[season_col] = 1.0

        raw_prediction = self.model.predict(input_data)[0]
        raw_prediction = max(0, raw_prediction)

        multiplier = self.unit_to_kg_multiplier.get(crop_name, 1000.0)
        indian_base_kg = indian_base * multiplier
        raw_prediction_kg = raw_prediction * multiplier

        if indian_base_kg <= 0:
            impact_ratio = 1.0
            vn_base_kg = 0.0
            used_source = "No_Base_Data"
        else:
            raw_ratio = raw_prediction_kg / indian_base_kg
            impact_ratio = max(0.75, min(raw_ratio, 1.25))
            
            if use_vn_base and crop_name in self.vn_base_yields:
                vn_base_kg = self.vn_base_yields[crop_name]
                used_source = "Vietnam_Stats"
            else:
                vn_base_kg = indian_base_kg
                used_source = "India_Kaggle"

        final_prediction_kg = vn_base_kg * impact_ratio

        uncertainty_penalty = 0.05
        if temp > 35 or temp < 15 or humid < 40 or soil_moist < 30 or soil_moist > 80:
            uncertainty_penalty += 0.10
        if data_quality == "imputed_warning":
            uncertainty_penalty += 0.20

        margin_error = final_prediction_kg * uncertainty_penalty

        return {
            "predicted_yield_raw": round(float(final_prediction_kg), 2),
            "safe_range": {
                "min": round(float(max(0, final_prediction_kg - margin_error)), 2),
                "max": round(float(final_prediction_kg + margin_error), 2)
            },
            "unit": "kg/ha",
            "diagnostics": {
                "season_detected": self.in_to_vn_display.get(season, season),
                "base_yield_used": round(float(vn_base_kg), 2),
                "base_yield_source": used_source,
                "weather_impact_ratio": round(float(impact_ratio), 4),
                "data_quality": data_quality,
                "uncertainty_margin": f"±{int(uncertainty_penalty * 100)}%",
                "domain_transfer_warning": "Heuristic transfer applied. Calibration with Vietnam native dataset recommended for production."
            }
        }

    def generate_advice(self, temp, humid, soil_moist, predicted_yield, base_yield):
        advice = []
        is_weather_bad = False
        
        if temp > 35:
            advice.append("CẢNH BÁO: Nhiệt độ đang quá nóng (Stress nhiệt). Cần phủ rơm rạ giữ ẩm hoặc bật hệ thống tưới phun sương làm mát.")
            is_weather_bad = True
        elif temp < 20:
            advice.append("CẢNH BÁO: Nhiệt độ lạnh. Tạm ngưng bón phân đạm, tăng cường lân/kali để cây chống rét.")
            is_weather_bad = True

        if soil_moist < 40:
            advice.append("CẢNH BÁO: Đất đang khô hạn. Cần kích hoạt máy bơm tưới ngay lập tức.")
            is_weather_bad = True
        elif soil_moist > 80:
            advice.append("CẢNH BÁO: Đất đang ngập úng. Cần khơi thông rãnh thoát nước để tránh thối rễ.")
            is_weather_bad = True

        if base_yield <= 0:
            advice.append("Không có dữ liệu gốc để so sánh năng suất chuẩn.")
        elif predicted_yield < base_yield * 0.85:
            advice.append("PHÂN TÍCH: Năng suất dự kiến đang sụt giảm. Hãy kiểm tra lại lượng phân bón và sâu bệnh.")
        elif predicted_yield >= base_yield * 1.05:
            if not is_weather_bad:
                advice.append("TỐT: Điều kiện môi trường đang lý tưởng, dự kiến bội thu.")
            else:
                advice.append("LƯU Ý: Tiềm năng giống tốt, nhưng cần giải quyết các cảnh báo môi trường ở trên để bảo vệ năng suất.")
        else:
            advice.append("BÌNH THƯỜNG: Năng suất dự kiến ở mức ổn định quanh chuẩn.")

        return advice
