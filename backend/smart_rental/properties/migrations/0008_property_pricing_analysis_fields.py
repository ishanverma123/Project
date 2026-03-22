from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0007_alter_property_departure_time_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='property',
            name='distance_km',
            field=models.DecimalField(decimal_places=2, default=12.0, max_digits=7),
        ),
        migrations.AddField(
            model_name='property',
            name='eco_incentive_pct',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AddField(
            model_name='property',
            name='estimated_duration_min',
            field=models.PositiveIntegerField(default=25),
        ),
        migrations.AddField(
            model_name='property',
            name='fuel_surcharge_per_km',
            field=models.DecimalField(decimal_places=2, default=0.25, max_digits=6),
        ),
        migrations.AddField(
            model_name='property',
            name='holiday_surcharge_pct',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AddField(
            model_name='property',
            name='loyalty_discount_pct',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AddField(
            model_name='property',
            name='promo_discount_pct',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
    ]
