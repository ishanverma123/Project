from datetime import datetime
from typing import Dict


FIXED_HOLIDAY_MM_DD = {
    "01-01",  # New Year
    "08-15",  # Independence Day
    "10-02",  # Gandhi Jayanti
    "12-25",  # Christmas
}


def _is_fixed_holiday(date_value: datetime) -> bool:
    return date_value.strftime("%m-%d") in FIXED_HOLIDAY_MM_DD


def resolve_policy_adjustments(
    departure_time: datetime,
    demand_multiplier: float,
    rider_booking_count: int,
    eco_eligible: bool,
) -> Dict[str, float]:
    # Fuel surcharge can vary with weekday/weekend demand and fuel pressure.
    if departure_time and departure_time.weekday() >= 5:
        fuel_surcharge_per_km = 0.35
    elif demand_multiplier >= 1.3:
        fuel_surcharge_per_km = 0.3
    else:
        fuel_surcharge_per_km = 0.25

    is_holiday = bool(departure_time and _is_fixed_holiday(departure_time))
    holiday_surcharge_pct = 12.0 if is_holiday else 0.0

    # Platform-level promos for midweek off-peak demand shaping.
    promo_discount_pct = 5.0 if departure_time and departure_time.weekday() in {1, 2} else 0.0

    # Loyalty is user-level and computed from prior bookings.
    if rider_booking_count >= 20:
        loyalty_discount_pct = 10.0
    elif rider_booking_count >= 10:
        loyalty_discount_pct = 7.0
    elif rider_booking_count >= 5:
        loyalty_discount_pct = 4.0
    else:
        loyalty_discount_pct = 0.0

    eco_incentive_pct = 3.0 if eco_eligible else 0.0

    return {
        "fuel_surcharge_per_km": fuel_surcharge_per_km,
        "promo_discount_pct": promo_discount_pct,
        "loyalty_discount_pct": loyalty_discount_pct,
        "eco_incentive_pct": eco_incentive_pct,
        "holiday_surcharge_pct": holiday_surcharge_pct,
        "is_holiday": float(is_holiday),
    }
