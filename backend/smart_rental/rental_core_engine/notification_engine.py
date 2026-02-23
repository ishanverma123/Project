class NotificationEngine:

    def booking_created_message(self, booking):
        return f"Booking created for {booking.property.title}"