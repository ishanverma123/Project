from datetime import datetime

from .policy import resolve_policy_adjustments
from .types import FareConfig, FareRequest, FareResult


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(value, max_value))


def calculate_fare(config: FareConfig, request: FareRequest) -> FareResult:
    distance_km = request.distance_km if request.distance_km > 0 else config.default_distance_km
    duration_min = request.duration_min if request.duration_min > 0 else config.default_duration_min

    departure_time = request.departure_time if isinstance(request.departure_time, datetime) else datetime.utcnow()
    policy = resolve_policy_adjustments(
        departure_time=departure_time,
        demand_multiplier=float(request.demand_multiplier),
        rider_booking_count=int(request.rider_booking_count or 0),
        eco_eligible=bool(request.eco_eligible),
    )

    fuel_surcharge_per_km = (
        float(request.fuel_surcharge_per_km)
        if request.fuel_surcharge_per_km is not None
        else float(policy["fuel_surcharge_per_km"])
    )
    promo_discount_pct = (
        float(request.promo_discount_pct)
        if request.promo_discount_pct is not None
        else float(policy["promo_discount_pct"])
    )
    loyalty_discount_pct = (
        float(request.loyalty_discount_pct)
        if request.loyalty_discount_pct is not None
        else float(policy["loyalty_discount_pct"])
    )
    eco_incentive_pct = (
        float(request.eco_incentive_pct)
        if request.eco_incentive_pct is not None
        else float(policy["eco_incentive_pct"])
    )
    holiday_surcharge_pct = (
        float(request.holiday_surcharge_pct)
        if request.holiday_surcharge_pct is not None
        else float(policy["holiday_surcharge_pct"])
    )

    base_component = float(config.base_fare)
    distance_component = distance_km * float(config.per_km_rate)
    duration_component = duration_min * float(config.per_min_rate)
    fuel_component = distance_km * fuel_surcharge_per_km

    raw_subtotal = base_component + distance_component + duration_component + fuel_component

    demand_multiplier = _clamp(float(request.demand_multiplier), 1.0, float(config.demand_surge_max))
    surged_total = raw_subtotal * demand_multiplier
    surge_component = surged_total - raw_subtotal

    time_multiplier = config.time_multiplier_peak if request.is_peak_hour else config.time_multiplier_offpeak
    time_adjusted_total = surged_total * float(time_multiplier)
    peak_component = time_adjusted_total - surged_total

    holiday_component = time_adjusted_total * max(holiday_surcharge_pct, 0.0) / 100.0
    subtotal = time_adjusted_total + holiday_component

    discounts_pct = max(promo_discount_pct, 0.0)
    discounts_pct += max(loyalty_discount_pct, 0.0)
    discounts_pct += max(eco_incentive_pct, 0.0)
    discounts_pct = _clamp(discounts_pct, 0.0, 60.0)

    discounts_total = subtotal * discounts_pct / 100.0
    total = max(subtotal - discounts_total, 0.0)

    return FareResult(
        base_component=base_component,
        distance_component=distance_component,
        duration_component=duration_component,
        fuel_component=fuel_component,
        surge_component=surge_component,
        peak_component=peak_component,
        holiday_component=holiday_component,
        discounts_total=discounts_total,
        subtotal=subtotal,
        total=total,
        policy_applied={
            "fuel_surcharge_per_km": round(fuel_surcharge_per_km, 2),
            "promo_discount_pct": round(promo_discount_pct, 2),
            "loyalty_discount_pct": round(loyalty_discount_pct, 2),
            "eco_incentive_pct": round(eco_incentive_pct, 2),
            "holiday_surcharge_pct": round(holiday_surcharge_pct, 2),
            "is_holiday": int(policy["is_holiday"]),
        },
    )
