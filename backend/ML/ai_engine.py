import joblib
import pandas as pd
import datetime
import os
import json


VN_BASE_YIELDS: dict[str, float] = {
    "rice":      6_500.0,
    "maize":     5_000.0,
    "sugarcane": 65_000.0,
    "lettuce":   25_000.0,
    "tomato":    30_000.0,
    "cucumber":  35_000.0,
}

UNIT_TO_KG_MULTIPLIER: dict[str, float] = {
    "cotton(lint)": 170.0,
    "jute":         180.0,
    "mesta":        180.0,
    "coconut":      1.2,
}

WHOLE_YEAR_CROPS: frozenset[str] = frozenset({
    "sugarcane", "coconut", "arecanut", "black pepper",
    "banana", "grapes", "mango", "orange", "papaya",
    "onion", "potato", "sweet potato",
    "cashewnut", "citrus fruit", "other fresh fruits",
    "pome fruit", "pome granet", "sapota", "pineapple",
    "garlic", "ginger", "dry ginger", "turmeric",
})

VN_TO_IN_SEASON: dict[str, str] = {
    "đông xuân": "rabi",
    "hè thu":    "kharif",
    "thu đông":  "autumn",
    "mùa đông":  "winter",
    "mùa khô":   "summer",
    "mùa mưa":   "kharif",
}

IN_TO_VN_DISPLAY: dict[str, str] = {
    "kharif":     "Mùa mưa / Hè Thu",
    "rabi":       "Mùa khô / Đông Xuân",
    "autumn":     "Thu Đông",
    "winter":     "Mùa Đông",
    "summer":     "Mùa Khô",
    "whole year": "Quanh năm",
}

DEFAULT_THRESHOLDS: dict[str, float] = {
    "Upper_temperature_threshold": 35.0,
    "Lower_temperature_threshold": 20.0,
    "Upper_humidity_threshold":    85.0,
    "Lower_humidity_threshold":    50.0,
    "Upper_moisture_threshold":    80.0,
    "Lower_moisture_threshold":    40.0,
}

SENSOR_VALID_RANGE: dict[str, tuple[float, float]] = {
    "temp":       (-10.0, 60.0),
    "humid":      (0.0,  100.0),
    "soil_moist": (0.0,  100.0),
}

SENSOR_DEFAULT: dict[str, float] = {
    "temp":       28.0,
    "humid":      75.0,
    "soil_moist": 50.0,
}

IMPACT_RATIO_CLAMP: tuple[float, float] = (0.75, 1.25)

HEALTH_SCORE_LABELS: tuple[tuple[int, str], ...] = (
    (85, "excellent"),
    (70, "good"),
    (50, "warning"),
    (0,  "critical"),
)


def _current_vn_season() -> str:
    month = datetime.datetime.now().month
    if month in {11, 12, 1, 2, 3}:
        return "rabi"
    if month in {4, 5, 6, 7, 8}:
        return "kharif"
    return "autumn"


def _classify_health_score(score: float) -> str:
    for threshold, label in HEALTH_SCORE_LABELS:
        if score >= threshold:
            return label
    return "critical"


class YieldPredictor:

    def __init__(self, models_dir: str | None = None) -> None:
        models_dir = self._resolve_models_dir(models_dir)
        self._load_model_artifacts(models_dir)
        self.crop_thresholds = self._load_crop_thresholds(models_dir)

    @staticmethod
    def _resolve_models_dir(models_dir: str | None) -> str:
        if models_dir is not None:
            return models_dir
        current_dir  = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(current_dir))
        resolved     = os.path.join(project_root, "ML", "models", "tabular")
        if not os.path.exists(resolved):
            raise FileNotFoundError(f"Models directory not found: {os.path.abspath(resolved)}")
        return resolved

    def _load_model_artifacts(self, models_dir: str) -> None:
        def _load(filename: str):
            return joblib.load(os.path.join(models_dir, filename))

        self.model            = _load("xgb_crop_yield_model.pkl")
        self.features         = _load("model_features.pkl")
        self.base_yield_dict  = _load("crop_base_yield_dict.pkl")
        self.optimal_temp_dict  = _load("crop_optimal_temp_dict.pkl")
        self.optimal_humid_dict = _load("crop_optimal_humid_dict.pkl")

    @staticmethod
    def _load_crop_thresholds(models_dir: str) -> dict:
        path = os.path.join(models_dir, "crop_thresholds_vn.json")
        try:
            with open(path, encoding="utf-8") as f:
                return {item["name_crop"]: item for item in json.load(f)}
        except FileNotFoundError:
            print(f"Cảnh báo: Không tìm thấy tệp {path}. Sẽ dùng ngưỡng mặc định.")
            return {}


    @staticmethod
    def _sanitize_sensor(
        value: float | None,
        key: str,
    ) -> tuple[float, bool]:
        lo, hi = SENSOR_VALID_RANGE[key]
        if value is None or not (lo <= value <= hi):
            return SENSOR_DEFAULT[key], True
        return value, False

    def _resolve_season(self, crop_name: str, manual_season: str | None) -> str:
        if manual_season:
            return VN_TO_IN_SEASON.get(manual_season.strip().lower(), manual_season.strip().lower())
        if crop_name in WHOLE_YEAR_CROPS:
            return "whole year"
        return _current_vn_season()


    def _build_feature_vector(
        self,
        crop_name: str,
        season: str,
        temp: float,
        humid: float,
        soil_moist: float,
        indian_base: float,
    ) -> pd.DataFrame:
        df = pd.DataFrame(0.0, index=[0], columns=self.features)

        opt_temp  = self.optimal_temp_dict.get(crop_name, 25.0)
        opt_humid = self.optimal_humid_dict.get(crop_name, 60.0)

        scalar_features = {
            "Temperature":      temp,
            "Humidity":         humid,
            "Soil_Moisture":    soil_moist,
            "Temp_Humid_Index": temp * humid,
            "Soil_Temp_Ratio":  soil_moist / (temp + 1),
            "Temp_Stress":      (temp  - opt_temp)  ** 2,
            "Humid_Stress":     (humid - opt_humid) ** 2,
            "Crop_Base_Yield":  indian_base,
        }
        for col, val in scalar_features.items():
            if col in self.features:
                df[col] = val

        for one_hot_col in (f"Crop_{crop_name}", f"Season_{season}"):
            if one_hot_col in self.features:
                df[one_hot_col] = 1.0

        return df


    def _compute_yield_kg(
        self,
        crop_name: str,
        raw_prediction: float,
        use_vn_base: bool,
    ) -> tuple[float, float, float, str]:
        multiplier     = UNIT_TO_KG_MULTIPLIER.get(crop_name, 1_000.0)
        indian_base    = self.base_yield_dict.get(crop_name, 0.0)
        indian_base_kg = indian_base * multiplier
        raw_kg         = raw_prediction * multiplier

        if indian_base_kg <= 0:
            impact_ratio = 1.0
            if use_vn_base and crop_name in VN_BASE_YIELDS:
                vn_base_kg = VN_BASE_YIELDS[crop_name]
                source     = "Vietnam_Stats"
            else:
                vn_base_kg = 0.0
                source     = "No_Base_Data"
        else:
            raw_ratio    = raw_kg / indian_base_kg
            lo, hi       = IMPACT_RATIO_CLAMP
            impact_ratio = max(lo, min(raw_ratio, hi))

            if use_vn_base and crop_name in VN_BASE_YIELDS:
                vn_base_kg = VN_BASE_YIELDS[crop_name]
                source     = "Vietnam_Stats"
            else:
                vn_base_kg = indian_base_kg
                source     = "India_Kaggle"

        final_kg = vn_base_kg * impact_ratio
        return final_kg, vn_base_kg, impact_ratio, source

    @staticmethod
    def _compute_uncertainty(
        temp: float,
        humid: float,
        soil_moist: float,
        data_quality: str,
    ) -> float:
        penalty = 0.05
        if temp > 35 or temp < 15 or humid < 40 or soil_moist < 30 or soil_moist > 80:
            penalty += 0.10
        if data_quality == "imputed_warning":
            penalty += 0.20
        return penalty


    def predict_realtime(
        self,
        temp: float | None,
        humid: float | None,
        soil_moist: float | None,
        crop_name: str,
        manual_season: str | None = None,
        use_vn_base: bool = True,
    ) -> dict:
        crop_name = crop_name.strip().lower()
        season    = self._resolve_season(crop_name, manual_season)

        temp,       imp_t  = self._sanitize_sensor(temp,       "temp")
        humid,      imp_h  = self._sanitize_sensor(humid,      "humid")
        soil_moist, imp_sm = self._sanitize_sensor(soil_moist, "soil_moist")
        data_quality = "imputed_warning" if (imp_t or imp_h or imp_sm) else "authentic"

        indian_base   = self.base_yield_dict.get(crop_name, 0.0)
        feature_df    = self._build_feature_vector(crop_name, season, temp, humid, soil_moist, indian_base)
        raw_pred      = max(0.0, float(self.model.predict(feature_df)[0]))

        final_kg, vn_base_kg, impact_ratio, source = self._compute_yield_kg(crop_name, raw_pred, use_vn_base)
        uncertainty   = self._compute_uncertainty(temp, humid, soil_moist, data_quality)
        margin        = final_kg * uncertainty

        health = self.calc_health_score(crop_name, temp, humid, soil_moist)

        return {
            "predicted_yield_raw": round(final_kg, 2),
            "safe_range": {
                "min": round(max(0.0, final_kg - margin), 2),
                "max": round(final_kg + margin, 2),
            },
            "unit": "kg/ha",
            "health": health,
            "diagnostics": {
                "season_detected":       IN_TO_VN_DISPLAY.get(season, season),
                "base_yield_used":       round(vn_base_kg, 2),
                "base_yield_source":     source,
                "weather_impact_ratio":  round(impact_ratio, 4),
                "data_quality":          data_quality,
                "uncertainty_margin":    f"±{int(uncertainty * 100)}%",
                "domain_transfer_warning": (
                    "Heuristic transfer applied. "
                    "Calibration with Vietnam native dataset recommended for production."
                ),
            },
        }


    def calc_health_score(
        self,
        crop_name: str,
        temp: float | None,
        humid: float | None,
        soil_moist: float | None,
    ) -> dict:
        crop_name = crop_name.strip().lower()
        th        = self.crop_thresholds.get(crop_name, DEFAULT_THRESHOLDS)

        score     = 100
        breakdown = []

        score, breakdown = self._score_temperature(score, breakdown, crop_name, temp, th)
        score, breakdown = self._score_soil_moisture(score, breakdown, crop_name, soil_moist, th)
        score, breakdown = self._score_humidity(score, breakdown, crop_name, humid, th)

        final_score    = max(0, min(100, score))
        overall_status = _classify_health_score(final_score)

        return {
            "score":          round(float(final_score), 1),
            "overall_status": overall_status,
            "thresholds_used": {
                "crop":         crop_name,
                "temperature":  {"min": th["Lower_temperature_threshold"], "max": th["Upper_temperature_threshold"]},
                "humidity":     {"min": th["Lower_humidity_threshold"],    "max": th["Upper_humidity_threshold"]},
                "soil_moisture":{"min": th["Lower_moisture_threshold"],    "max": th["Upper_moisture_threshold"]},
            },
            "breakdown": breakdown,
        }


    @staticmethod
    def _score_temperature(
        score: int,
        breakdown: list,
        crop_name: str,
        temp: float | None,
        th: dict,
    ) -> tuple[int, list]:
        if temp is None:
            return score, breakdown

        t_hi  = th["Upper_temperature_threshold"]
        t_lo  = th["Lower_temperature_threshold"]
        t_mid = (t_hi + t_lo) / 2
        t_opt_range = (t_hi - t_lo) * 0.3
        t_opt_min, t_opt_max = t_mid - t_opt_range, t_mid + t_opt_range

        if temp > t_hi:
            deduct = min(35, round((temp - t_hi) * 8))
            entry  = {"sensor": "temperature", "value": temp, "status": "critical_high",
                      "deducted": deduct,
                      "message": f"Nhiệt độ {temp}°C vượt ngưỡng tối đa {t_hi}°C của {crop_name}"}
        elif temp < t_lo:
            deduct = min(35, round((t_lo - temp) * 8))
            entry  = {"sensor": "temperature", "value": temp, "status": "critical_low",
                      "deducted": deduct,
                      "message": f"Nhiệt độ {temp}°C thấp hơn ngưỡng tối thiểu {t_lo}°C của {crop_name}"}
        elif abs(temp - t_mid) > t_opt_range:
            deduct = 8
            entry  = {"sensor": "temperature", "value": temp, "status": "warning",
                      "deducted": deduct,
                      "message": (f"Nhiệt độ {temp}°C an toàn nhưng chưa đạt mức tối ưu "
                                  f"({round(t_opt_min, 1)}–{round(t_opt_max, 1)}°C)")}
        else:
            deduct = 0
            entry  = {"sensor": "temperature", "value": temp, "status": "good",
                      "deducted": 0, "message": f"Nhiệt độ {temp}°C đang ở mức lý tưởng"}

        return score - deduct, breakdown + [entry]

    @staticmethod
    def _score_soil_moisture(
        score: int,
        breakdown: list,
        crop_name: str,
        soil_moist: float | None,
        th: dict,
    ) -> tuple[int, list]:
        if soil_moist is None:
            return score, breakdown

        sm_hi  = th["Upper_moisture_threshold"]
        sm_lo  = th["Lower_moisture_threshold"]
        sm_mid = (sm_hi + sm_lo) / 2
        sm_opt_range = (sm_hi - sm_lo) * 0.3
        sm_opt_min, sm_opt_max = sm_mid - sm_opt_range, sm_mid + sm_opt_range

        if soil_moist < sm_lo:
            deduct = min(35, round((sm_lo - soil_moist) * 1.5))
            entry  = {"sensor": "soil_moisture", "value": soil_moist, "status": "critical_low",
                      "deducted": deduct,
                      "message": f"Đất khô hạn {soil_moist}% — ngưỡng tối thiểu là {sm_lo}% cho {crop_name}"}
        elif soil_moist > sm_hi:
            deduct = min(30, round((soil_moist - sm_hi) * 1.5))
            entry  = {"sensor": "soil_moisture", "value": soil_moist, "status": "critical_high",
                      "deducted": deduct,
                      "message": f"Đất ngập úng {soil_moist}% — ngưỡng tối đa là {sm_hi}% cho {crop_name}"}
        elif abs(soil_moist - sm_mid) > sm_opt_range:
            deduct = 6
            entry  = {"sensor": "soil_moisture", "value": soil_moist, "status": "warning",
                      "deducted": deduct,
                      "message": (f"Độ ẩm đất {soil_moist}% an toàn nhưng chưa đạt mức tối ưu "
                                  f"({round(sm_opt_min, 1)}–{round(sm_opt_max, 1)}%)")}
        else:
            deduct = 0
            entry  = {"sensor": "soil_moisture", "value": soil_moist, "status": "good",
                      "deducted": 0, "message": f"Độ ẩm đất {soil_moist}% đang ở mức lý tưởng"}

        return score - deduct, breakdown + [entry]

    @staticmethod
    def _score_humidity(
        score: int,
        breakdown: list,
        crop_name: str,
        humid: float | None,
        th: dict,
    ) -> tuple[int, list]:
        if humid is None:
            return score, breakdown

        h_hi  = th["Upper_humidity_threshold"]
        h_lo  = th["Lower_humidity_threshold"]
        h_mid = (h_hi + h_lo) / 2
        h_opt_range = (h_hi - h_lo) * 0.3
        h_opt_min, h_opt_max = h_mid - h_opt_range, h_mid + h_opt_range

        if humid > h_hi:
            deduct = min(20, round((humid - h_hi) * 1.2))
            entry  = {"sensor": "humidity", "value": humid, "status": "critical_high",
                      "deducted": deduct,
                      "message": f"Độ ẩm KK {humid}% quá cao - nguy cơ nấm bệnh (ngưỡng {h_hi}%)"}
        elif humid < h_lo:
            deduct = min(20, round((h_lo - humid) * 1.0))
            entry  = {"sensor": "humidity", "value": humid, "status": "critical_low",
                      "deducted": deduct,
                      "message": f"Độ ẩm KK {humid}% thấp - nguy cơ cây thoát hơi nước mạnh (ngưỡng {h_lo}%)"}
        elif abs(humid - h_mid) > h_opt_range:
            deduct = 5
            entry  = {"sensor": "humidity", "value": humid, "status": "warning",
                      "deducted": deduct,
                      "message": (f"Độ ẩm KK {humid}% an toàn nhưng chưa đạt mức tối ưu "
                                  f"({round(h_opt_min, 1)}-{round(h_opt_max, 1)}%)")}
        else:
            deduct = 0
            entry  = {"sensor": "humidity", "value": humid, "status": "good",
                      "deducted": 0, "message": f"Độ ẩm KK {humid}% đang ở mức lý tưởng"}

        return score - deduct, breakdown + [entry]


    def generate_advice(
        self,
        crop_name: str,
        temp: float,
        humid: float,
        soil_moist: float,
        predicted_yield: float,
        base_yield: float,
    ) -> list[str]:
        crop_name  = crop_name.strip().lower()
        th         = self.crop_thresholds.get(crop_name, DEFAULT_THRESHOLDS)
        advice     = []
        is_bad_env = False

        if temp > th["Upper_temperature_threshold"]:
            advice.append(
                f"CẢNH BÁO: Nhiệt độ ({temp}°C) đang quá nóng so với ngưỡng chịu đựng của "
                f"{crop_name} ({th['Upper_temperature_threshold']}°C). "
                f"Cần phủ rơm rạ giữ ẩm hoặc bật hệ thống tưới phun sương làm mát."
            )
            is_bad_env = True
        elif temp < th["Lower_temperature_threshold"]:
            advice.append(
                f"CẢNH BÁO: Nhiệt độ ({temp}°C) quá lạnh đối với {crop_name} "
                f"(ngưỡng dưới: {th['Lower_temperature_threshold']}°C). "
                f"Tạm ngưng bón phân đạm, tăng cường lân/kali để cây chống rét."
            )
            is_bad_env = True

        if soil_moist < th["Lower_moisture_threshold"]:
            advice.append(
                f"CẢNH BÁO: Đất khô hạn ({soil_moist}%). {crop_name} cần độ ẩm đất tối thiểu "
                f"ở mức {th['Lower_moisture_threshold']}%. Cần kích hoạt máy bơm tưới ngay lập tức."
            )
            is_bad_env = True
        elif soil_moist > th["Upper_moisture_threshold"]:
            advice.append(
                f"CẢNH BÁO: Đất ngập úng ({soil_moist}%). {crop_name} chỉ chịu được tối đa "
                f"{th['Upper_moisture_threshold']}%. Cần khơi thông rãnh thoát nước để tránh thối rễ."
            )
            is_bad_env = True

        if humid > th["Upper_humidity_threshold"]:
            advice.append(
                f"LƯU Ý: Độ ẩm không khí quá cao ({humid}%). Môi trường này rất dễ phát sinh "
                f"nấm bệnh cho {crop_name}, cần chú ý phun thuốc phòng ngừa."
            )
            is_bad_env = True
        elif humid < th["Lower_humidity_threshold"]:
            advice.append(
                f"LƯU Ý: Độ ẩm không khí thấp ({humid}%). "
                f"Môi trường hanh khô, cần theo dõi sát tốc độ bốc hơi nước của lá."
            )

        if base_yield <= 0:
            advice.append("Không có dữ liệu gốc để so sánh năng suất chuẩn.")
        elif predicted_yield < base_yield * 0.85:
            advice.append("PHÂN TÍCH: Năng suất dự kiến đang sụt giảm. Hãy kiểm tra lại lượng phân bón và sâu bệnh.")
        elif predicted_yield >= base_yield * 1.05:
            if not is_bad_env:
                advice.append("TỐT: Điều kiện môi trường đang lý tưởng, dự kiến bội thu.")
            else:
                advice.append("LƯU Ý: Tiềm năng giống tốt, nhưng cần giải quyết các cảnh báo môi trường ở trên để bảo vệ năng suất.")
        else:
            advice.append("BÌNH THƯỜNG: Năng suất dự kiến ở mức ổn định quanh chuẩn.")

        return advice