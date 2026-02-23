class PricingEngine:

    def calculate_total_price(self, price_per_day, start_date, end_date):
        days = (end_date - start_date).days
        if days <= 0:
            return 0
        return days * float(price_per_day)