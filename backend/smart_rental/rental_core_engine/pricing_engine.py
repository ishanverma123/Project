from datetime import datetime

try:
    from carpool_fare_engine import FareConfig, FareRequest, calculate_fare, resolve_policy_adjustments
except ImportError:
    FareConfig = None
    FareRequest = None
    calculate_fare = None
    resolve_policy_adjustments = None


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
            "base_fare": 1.0,           # Updated from 25.0
            "per_km_rate": 0.07,        # Updated from 8.0
            "per_min_rate": 0.015,      # Updated from 0.5
            "default_distance_km": 1.0,
            "default_duration_min": 2.0,
            "fuel_surcharge_per_km": 0.03,  # Updated from 0.25
            "time_multiplier_peak": 1.1,    # Updated from 1.2
            "time_multiplier_offpeak": 1.0,
            "demand_surge_max": 1.15,       # Updated from 2.0
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
        rider_booking_count=0,
        eco_eligible=False,
    ):
        demand_multiplier = self._demand_multiplier(seats_left=seats_left, max_passengers=max_passengers)
        is_peak_hour = self._is_peak_hour(departure_time)
        config = dict(self.config)

        policy = {
            'fuel_surcharge_per_km': config['fuel_surcharge_per_km'],
            'promo_discount_pct': 0.0,
            'loyalty_discount_pct': 0.0,
            'eco_incentive_pct': 0.0,
            'holiday_surcharge_pct': 0.0,
            'is_holiday': 0,
        }

        if resolve_policy_adjustments and isinstance(departure_time, datetime):
            resolved = resolve_policy_adjustments(
                departure_time=departure_time,
                demand_multiplier=demand_multiplier,
                rider_booking_count=int(rider_booking_count or 0),
                eco_eligible=bool(eco_eligible),
            )
            policy.update(resolved)
            config['fuel_surcharge_per_km'] = float(policy['fuel_surcharge_per_km'])

        if calculate_fare and FareConfig and FareRequest:
            fare = calculate_fare(
                FareConfig(**config),
                FareRequest(
                    distance_km=float(distance_km),
                    duration_min=float(duration_min),
                    demand_multiplier=demand_multiplier,
                    promo_discount_pct=None,
                    loyalty_discount_pct=None,
                    eco_incentive_pct=None,
                    holiday_surcharge_pct=None,
                    fuel_surcharge_per_km=None,
                    is_peak_hour=is_peak_hour,
                    departure_time=departure_time,
                    rider_booking_count=int(rider_booking_count or 0),
                    eco_eligible=bool(eco_eligible),
                ),
            )
            breakdown = fare.as_dict()
            policy = dict(breakdown.get('policy_applied') or policy)
        else:
            breakdown = _fallback_calculate_fare(
                config,
                {
                    "distance_km": float(distance_km),
                    "duration_min": float(duration_min),
                    "demand_multiplier": demand_multiplier,
                    "promo_discount_pct": float(policy['promo_discount_pct']),
                    "loyalty_discount_pct": float(policy['loyalty_discount_pct']),
                    "eco_incentive_pct": float(policy['eco_incentive_pct']),
                    "holiday_surcharge_pct": float(policy['holiday_surcharge_pct']),
                    "is_peak_hour": is_peak_hour,
                },
            )
            breakdown['policy_applied'] = policy

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
            "policy_applied": policy,
            "breakdown": breakdown,
        }