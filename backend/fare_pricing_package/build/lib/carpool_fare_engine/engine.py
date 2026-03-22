from .types import FareConfig, FareRequest, FareResult


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(value, max_value))


def calculate_fare(config: FareConfig, request: FareRequest) -> FareResult:
    distance_km = request.distance_km if request.distance_km > 0 else config.default_distance_km
    duration_min = request.duration_min if request.duration_min > 0 else config.default_duration_min

    base_component = float(config.base_fare)
    distance_component = distance_km * float(config.per_km_rate)
    duration_component = duration_min * float(config.per_min_rate)
    fuel_component = distance_km * float(config.fuel_surcharge_per_km)

    raw_subtotal = base_component + distance_component + duration_component + fuel_component

    demand_multiplier = _clamp(float(request.demand_multiplier), 1.0, float(config.demand_surge_max))
    surged_total = raw_subtotal * demand_multiplier
    surge_component = surged_total - raw_subtotal

    time_multiplier = config.time_multiplier_peak if request.is_peak_hour else config.time_multiplier_offpeak
    time_adjusted_total = surged_total * float(time_multiplier)
    peak_component = time_adjusted_total - surged_total

    holiday_component = time_adjusted_total * max(float(request.holiday_surcharge_pct), 0.0) / 100.0
    subtotal = time_adjusted_total + holiday_component

    discounts_pct = max(float(request.promo_discount_pct), 0.0)
    discounts_pct += max(float(request.loyalty_discount_pct), 0.0)
    discounts_pct += max(float(request.eco_incentive_pct), 0.0)
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
    )
