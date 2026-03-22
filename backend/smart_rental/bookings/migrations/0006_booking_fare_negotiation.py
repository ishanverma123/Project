from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0005_booking_status_pending'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='driver_counter_offer_per_seat',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='listed_price_per_seat',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='booking',
            name='platform_suggested_price_per_seat',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='booking',
            name='pricing_breakdown',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='booking',
            name='requested_bid_per_seat',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True),
        ),
        migrations.AlterField(
            model_name='booking',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('countered', 'Countered'),
                    ('approved', 'Approved'),
                    ('rejected', 'Rejected'),
                    ('confirmed', 'Confirmed'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
    ]
