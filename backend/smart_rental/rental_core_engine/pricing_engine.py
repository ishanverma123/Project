from datetime import datetime

try:
    from carpool_fare_engine import FareConfig, FareRequest, calculate_fare
except ImportError:
    FareConfig = None
    FareRequest = None
    calculate_fare = None


def _fallback_calculate_fare(config, request):
    distance_km = request["distance_km"] if request["distance_km"] > 0 else config["default_distance_km"]
    duration_min = request["duration_min"] if request["duration_min"] > 0 else config["default_duration_min"]

    base_component = float(config["base_fare"])
    distance_component = distance_km * float(config["per_km_rate"])
    duration_component = duration_min * float(config["per_min_rate"])
    fuel_component = distance_km * float(config["fuel_surcharge_per_km"])

    raw_subtotal = base_component + distance_component + duration_component + fuel_component
    demand_multiplier = max(1.0, min(float(request["demand_multiplier"]), float(config["demand_surge_max"])))
    surged_total = raw_subtotal * demand_multiplier
    surge_component = surged_total - raw_subtotal

    time_multiplier = float(config["time_multiplier_peak"] if request["is_peak_hour"] else config["time_multiplier_offpeak"])
    time_adjusted_total = surged_total * time_multiplier
    peak_component = time_adjusted_total - surged_total

    holiday_component = time_adjusted_total * max(float(request["holiday_surcharge_pct"]), 0.0) / 100.0
    subtotal = time_adjusted_total + holiday_component

    discounts_pct = max(float(request["promo_discount_pct"]), 0.0)
    discounts_pct += max(float(request["loyalty_discount_pct"]), 0.0)
    discounts_pct += max(float(request["eco_incentive_pct"]), 0.0)
    discounts_pct = max(0.0, min(discounts_pct, 60.0))
    discounts_total = subtotal * discounts_pct / 100.0
    total = max(subtotal - discounts_total, 0.0)

    return {
        "base_component": round(base_component, 2),
        "distance_component": round(distance_component, 2),
        "duration_component": round(duration_component, 2),
        "fuel_component": round(fuel_component, 2),
        "surge_component": round(surge_component, 2),
        "peak_component": round(peak_component, 2),
        "holiday_component": round(holiday_component, 2),
        "discounts_total": round(discounts_total, 2),
        "subtotal": round(subtotal, 2),
        "total": round(total, 2),
    }


class PricingEngine:
    def __init__(self):
        self.config = {
            "base_fare": 25.0,
            "per_km_rate": 8.0,
            "per_min_rate": 0.5,
            "default_distance_km": 12.0,
            "default_duration_min": 25.0,
            "fuel_surcharge_per_km": 0.25,
            "time_multiplier_peak": 1.2,
            "time_multiplier_offpeak": 1.0,
            "demand_surge_max": 2.0,
        }

    def _demand_multiplier(self, seats_left, max_passengers):
        if max_passengers <= 0:
            return 1.0
        occupancy = 1.0 - (max(seats_left, 0) / max_passengers)
        return round(1.0 + occupancy * 0.45, 2)

    def _is_peak_hour(self, departure_time):
        if not isinstance(departure_time, datetime):
            return False
        hour = departure_time.hour
        return 7 <= hour <= 10 or 17 <= hour <= 21

    def suggest_price_per_seat(
        self,
        listed_price_per_seat,
        departure_time,
        seats_left,
        max_passengers,
        distance_km=0.0,
        duration_min=0.0,
        promo_discount_pct=0.0,
        loyalty_discount_pct=0.0,
        eco_incentive_pct=0.0,
        holiday_surcharge_pct=0.0,
    ):
        demand_multiplier = self._demand_multiplier(seats_left=seats_left, max_passengers=max_passengers)
        is_peak_hour = self._is_peak_hour(departure_time)

        if calculate_fare and FareConfig and FareRequest:
            fare = calculate_fare(
                FareConfig(**self.config),
                FareRequest(
                    distance_km=float(distance_km),
                    duration_min=float(duration_min),
                    demand_multiplier=demand_multiplier,
                    promo_discount_pct=float(promo_discount_pct),
                    loyalty_discount_pct=float(loyalty_discount_pct),
                    eco_incentive_pct=float(eco_incentive_pct),
                    holiday_surcharge_pct=float(holiday_surcharge_pct),
                    is_peak_hour=is_peak_hour,
                ),
            )
            breakdown = fare.as_dict()
        else:
            breakdown = _fallback_calculate_fare(
                self.config,
                {
                    "distance_km": float(distance_km),
                    "duration_min": float(duration_min),
                    "demand_multiplier": demand_multiplier,
                    "promo_discount_pct": float(promo_discount_pct),
                    "loyalty_discount_pct": float(loyalty_discount_pct),
                    "eco_incentive_pct": float(eco_incentive_pct),
                    "holiday_surcharge_pct": float(holiday_surcharge_pct),
                    "is_peak_hour": is_peak_hour,
                },
            )

        suggested = float(breakdown["total"])
        listed = float(listed_price_per_seat or 0)
        delta = round(suggested - listed, 2)
        comparison = "higher" if delta > 0 else "lower" if delta < 0 else "equal"

        return {
            "suggested_price_per_seat": round(suggested, 2),
            "listed_price_per_seat": round(listed, 2),
            "difference": delta,
            "comparison": comparison,
            "demand_multiplier": demand_multiplier,
            "is_peak_hour": is_peak_hour,
            "breakdown": breakdown,
        }