import joblib
import pandas as pd
import datetime
import os
import json
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
            'sugarcane': 65000.0,
            'lettuce':   25000.0,  
            'tomato':    30000.0,   
            'cucumber':  35000.0
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
        try:
            thresholds_path = os.path.join(models_dir, 'crop_thresholds_vn.json')
            with open(thresholds_path, 'r', encoding='utf-8') as f:
                thresholds_list = json.load(f)
                # Chuyển list thành dictionary để tra cứu O(1) bằng tên cây
                self.crop_thresholds = {item['name_crop']: item for item in thresholds_list}
        except FileNotFoundError:
            print(f"Cảnh báo: Không tìm thấy tệp {thresholds_path}. Sẽ dùng ngưỡng mặc định.")
            self.crop_thresholds = {}

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
            if use_vn_base and crop_name in self.vn_base_yields:
                vn_base_kg   = self.vn_base_yields[crop_name]
                impact_ratio = 1.0   # không có Indian base để so sánh
                used_source  = "Vietnam_Stats"
                final_prediction_kg = vn_base_kg * impact_ratio
            else:
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

        # ── Sức khỏe cây theo ngưỡng thực tế từng loại cây ───────────────────
        health = self.calc_health_score(crop_name, temp, humid, soil_moist)

        return {
            "predicted_yield_raw": round(float(final_prediction_kg), 2),
            "safe_range": {
                "min": round(float(max(0, final_prediction_kg - margin_error)), 2),
                "max": round(float(final_prediction_kg + margin_error), 2)
            },
            "unit": "kg/ha",
            "health": health,
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

    def calc_health_score(self, crop_name, temp, humid, soil_moist):
        """
        Tính sức khỏe cây trồng (0-100) dựa trên ngưỡng chịu đựng thực tế từng loại cây.
        Trả về score + breakdown chi tiết từng chỉ số.
        """
        crop_name = crop_name.strip().lower()
        th = self.crop_thresholds.get(crop_name, {
            "Upper_temperature_threshold": 35.0,
            "Lower_temperature_threshold": 20.0,
            "Upper_humidity_threshold":    85.0,
            "Lower_humidity_threshold":    50.0,
            "Upper_moisture_threshold":    80.0,
            "Lower_moisture_threshold":    40.0,
        })

        score = 100
        breakdown = []

        # ── Nhiệt độ ──────────────────────────────────────────────────────────
        t_hi = th["Upper_temperature_threshold"]
        t_lo = th["Lower_temperature_threshold"]
        t_mid = (t_hi + t_lo) / 2
        t_optimal_range = (t_hi - t_lo) * 0.3   # 30% vùng giữa coi là tối ưu

        if temp is not None:
            if temp > t_hi:
                excess = temp - t_hi
                # Mỗi 1°C vượt ngưỡng trừ 8 điểm, tối đa 35
                deduct = min(35, round(excess * 8))
                score -= deduct
                breakdown.append({
                    "sensor": "temperature",
                    "value": temp,
                    "status": "critical_high",
                    "deducted": deduct,
                    "message": f"Nhiệt độ {temp}°C vượt ngưỡng tối đa {t_hi}°C của {crop_name}"
                })
            elif temp < t_lo:
                deficit = t_lo - temp
                deduct = min(35, round(deficit * 8))
                score -= deduct
                breakdown.append({
                    "sensor": "temperature",
                    "value": temp,
                    "status": "critical_low",
                    "deducted": deduct,
                    "message": f"Nhiệt độ {temp}°C thấp hơn ngưỡng tối thiểu {t_lo}°C của {crop_name}"
                })
            elif abs(temp - t_mid) > t_optimal_range:
                deduct = 8
                score -= deduct
                breakdown.append({
                    "sensor": "temperature",
                    "value": temp,
                    "status": "warning",
                    "deducted": deduct,
                    "message": f"Nhiệt độ {temp}°C chưa lý tưởng (tối ưu {t_lo}–{t_hi}°C)"
                })
            else:
                breakdown.append({
                    "sensor": "temperature",
                    "value": temp,
                    "status": "good",
                    "deducted": 0,
                    "message": f"Nhiệt độ {temp}°C trong vùng tối ưu"
                })

        # ── Độ ẩm đất ─────────────────────────────────────────────────────────
        sm_hi = th["Upper_moisture_threshold"]
        sm_lo = th["Lower_moisture_threshold"]
        sm_mid = (sm_hi + sm_lo) / 2
        sm_optimal_range = (sm_hi - sm_lo) * 0.3

        if soil_moist is not None:
            if soil_moist < sm_lo:
                deficit = sm_lo - soil_moist
                deduct = min(35, round(deficit * 1.5))
                score -= deduct
                breakdown.append({
                    "sensor": "soil_moisture",
                    "value": soil_moist,
                    "status": "critical_low",
                    "deducted": deduct,
                    "message": f"Đất khô hạn {soil_moist}% — ngưỡng tối thiểu {sm_lo}% cho {crop_name}"
                })
            elif soil_moist > sm_hi:
                excess = soil_moist - sm_hi
                deduct = min(30, round(excess * 1.5))
                score -= deduct
                breakdown.append({
                    "sensor": "soil_moisture",
                    "value": soil_moist,
                    "status": "critical_high",
                    "deducted": deduct,
                    "message": f"Đất ngập úng {soil_moist}% — ngưỡng tối đa {sm_hi}% cho {crop_name}"
                })
            elif abs(soil_moist - sm_mid) > sm_optimal_range:
                deduct = 6
                score -= deduct
                breakdown.append({
                    "sensor": "soil_moisture",
                    "value": soil_moist,
                    "status": "warning",
                    "deducted": deduct,
                    "message": f"Độ ẩm đất {soil_moist}% chưa tối ưu (lý tưởng {sm_lo}–{sm_hi}%)"
                })
            else:
                breakdown.append({
                    "sensor": "soil_moisture",
                    "value": soil_moist,
                    "status": "good",
                    "deducted": 0,
                    "message": f"Độ ẩm đất {soil_moist}% trong vùng tối ưu"
                })

        # ── Độ ẩm không khí ───────────────────────────────────────────────────
        h_hi = th["Upper_humidity_threshold"]
        h_lo = th["Lower_humidity_threshold"]
        h_mid = (h_hi + h_lo) / 2
        h_optimal_range = (h_hi - h_lo) * 0.3

        if humid is not None:
            if humid > h_hi:
                excess = humid - h_hi
                deduct = min(20, round(excess * 1.2))
                score -= deduct
                breakdown.append({
                    "sensor": "humidity",
                    "value": humid,
                    "status": "critical_high",
                    "deducted": deduct,
                    "message": f"Độ ẩm KK {humid}% quá cao — nguy cơ nấm bệnh cho {crop_name}"
                })
            elif humid < h_lo:
                deficit = h_lo - humid
                deduct = min(20, round(deficit * 1.0))
                score -= deduct
                breakdown.append({
                    "sensor": "humidity",
                    "value": humid,
                    "status": "critical_low",
                    "deducted": deduct,
                    "message": f"Độ ẩm KK {humid}% thấp — cây thoát hơi nước mạnh (ngưỡng {h_lo}%)"
                })
            elif abs(humid - h_mid) > h_optimal_range:
                deduct = 5
                score -= deduct
                breakdown.append({
                    "sensor": "humidity",
                    "value": humid,
                    "status": "warning",
                    "deducted": deduct,
                    "message": f"Độ ẩm KK {humid}% chưa lý tưởng (tối ưu {h_lo}–{h_hi}%)"
                })
            else:
                breakdown.append({
                    "sensor": "humidity",
                    "value": humid,
                    "status": "good",
                    "deducted": 0,
                    "message": f"Độ ẩm KK {humid}% trong vùng tối ưu"
                })

        final_score = max(0, min(100, score))

        # Trạng thái tổng
        if final_score >= 85:
            overall_status = "excellent"
        elif final_score >= 70:
            overall_status = "good"
        elif final_score >= 50:
            overall_status = "warning"
        else:
            overall_status = "critical"

        return {
            "score": round(float(final_score), 1),
            "overall_status": overall_status,
            "thresholds_used": {
                "crop": crop_name,
                "temperature": {"min": t_lo, "max": t_hi},
                "humidity":    {"min": h_lo, "max": h_hi},
                "soil_moisture": {"min": sm_lo, "max": sm_hi},
            },
            "breakdown": breakdown
        }

    def generate_advice(self, crop_name, temp, humid, soil_moist, predicted_yield, base_yield):
        advice = []
        is_weather_bad = False
        crop_name = crop_name.strip().lower()

        thresholds = self.crop_thresholds.get(crop_name, {
            "Upper_temperature_threshold": 35.0,
            "Lower_temperature_threshold": 20.0,
            "Upper_humidity_threshold": 85.0,
            "Lower_humidity_threshold": 50.0,
            "Upper_moisture_threshold": 80.0,
            "Lower_moisture_threshold": 40.0
        })

        if temp > thresholds["Upper_temperature_threshold"]:
            advice.append(f"CẢNH BÁO: Nhiệt độ ({temp}°C) đang quá nóng so với ngưỡng chịu đựng của {crop_name} ({thresholds['Upper_temperature_threshold']}°C). Cần phủ rơm rạ giữ ẩm hoặc bật hệ thống tưới phun sương làm mát.")
            is_weather_bad = True
        elif temp < thresholds["Lower_temperature_threshold"]:
            advice.append(f"CẢNH BÁO: Nhiệt độ ({temp}°C) quá lạnh đối với {crop_name} (ngưỡng dưới: {thresholds['Lower_temperature_threshold']}°C). Tạm ngưng bón phân đạm, tăng cường lân/kali để cây chống rét.")
            is_weather_bad = True

        if soil_moist < thresholds["Lower_moisture_threshold"]:
            advice.append(f"CẢNH BÁO: Đất khô hạn ({soil_moist}%). {crop_name} cần độ ẩm đất tối thiểu ở mức {thresholds['Lower_moisture_threshold']}%. Cần kích hoạt máy bơm tưới ngay lập tức.")
            is_weather_bad = True
        elif soil_moist > thresholds["Upper_moisture_threshold"]:
            advice.append(f"CẢNH BÁO: Đất ngập úng ({soil_moist}%). {crop_name} chỉ chịu được tối đa {thresholds['Upper_moisture_threshold']}%. Cần khơi thông rãnh thoát nước để tránh thối rễ.")
            is_weather_bad = True

        if humid > thresholds["Upper_humidity_threshold"]:
            advice.append(f"LƯU Ý: Độ ẩm không khí quá cao ({humid}%). Môi trường này rất dễ phát sinh nấm bệnh cho {crop_name}, cần chú ý phun thuốc phòng ngừa.")
            is_weather_bad = True
        elif humid < thresholds["Lower_humidity_threshold"]:
            advice.append(f"LƯU Ý: Độ ẩm không khí thấp ({humid}%). Môi trường hanh khô, cần theo dõi sát tốc độ bốc hơi nước của lá.")

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
