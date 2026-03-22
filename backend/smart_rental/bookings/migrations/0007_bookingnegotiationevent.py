from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0006_booking_fare_negotiation'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BookingNegotiationEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_type', models.CharField(choices=[('booking_requested', 'Booking Requested'), ('driver_countered', 'Driver Countered'), ('driver_approved', 'Driver Approved'), ('driver_rejected', 'Driver Rejected'), ('traveller_countered', 'Traveller Countered'), ('traveller_accepted_counter', 'Traveller Accepted Counter')], max_length=50)),
                ('message', models.CharField(max_length=255)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='booking_events', to=settings.AUTH_USER_MODEL)),
                ('booking', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='negotiation_events', to='bookings.booking')),
            ],
            options={
                'ordering': ['created_at', 'id'],
            },
        ),
    ]
