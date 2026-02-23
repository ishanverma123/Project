class RecommendationEngine:

    def recommend(self, properties, max_price):
        return [p for p in properties if p.price_per_day <= max_price]