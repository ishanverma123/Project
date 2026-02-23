class PolicyEngine:

    def validate_booking_duration(self, start_date, end_date):
        days = (end_date - start_date).days
        return days <= 30