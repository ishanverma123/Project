class BookingEngine:

    def validate_dates(self, start_date, end_date):
        """
        Ensure start date is before end date
        """
        return start_date < end_date