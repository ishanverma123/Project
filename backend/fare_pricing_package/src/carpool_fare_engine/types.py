from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional


@dataclass
class FareConfig:
    base_fare: float = 2.0
    per_km_rate: float = 0.12
    per_min_rate: float = 0.04
    default_distance_km: float = 1.0
    default_duration_min: float = 2.0
    fuel_surcharge_per_km: float = 0.06
    time_multiplier_peak: float = 1.0
    time_multiplier_offpeak: float = 1.0
    demand_surge_max: float = 2.0


@dataclass
class FareRequest:
    distance_km: float = 0.0
    duration_min: float = 0.0
    demand_multiplier: float = 1.0
    promo_discount_pct: Optional[float] = None
    loyalty_discount_pct: Optional[float] = None
    eco_incentive_pct: Optional[float] = None
    holiday_surcharge_pct: Optional[float] = None
    fuel_surcharge_per_km: Optional[float] = None
    is_peak_hour: bool = False
    departure_time: Optional[datetime] = None
    rider_booking_count: int = 0
    eco_eligible: bool = False


@dataclass
class FareResult:
    base_component: float
    distance_component: float
    duration_component: float
    fuel_component: float
    surge_component: float
    peak_component: float
    holiday_component: float
    discounts_total: float
    subtotal: float
    total: float
    policy_applied: Dict[str, float]

    def as_dict(self) -> Dict[str, float]:
        return {
            "base_component": round(self.base_component, 2),
            "distance_component": round(self.distance_component, 2),
            "duration_component": round(self.duration_component, 2),
            "fuel_component": round(self.fuel_component, 2),
            "surge_component": round(self.surge_component, 2),
            "peak_component": round(self.peak_component, 2),
            "holiday_component": round(self.holiday_component, 2),
            "discounts_total": round(self.discounts_total, 2),
            "subtotal": round(self.subtotal, 2),
            "total": round(self.total, 2),
            "policy_applied": self.policy_applied,
        }
