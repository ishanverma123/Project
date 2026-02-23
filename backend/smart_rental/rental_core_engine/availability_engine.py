class AvailabilityEngine:

    def is_available(self, property_obj, start_date, end_date):
        bookings = property_obj.booking_set.all()

        for booking in bookings:
            if not (end_date <= booking.start_date or start_date >= booking.end_date):
                return False

        return True