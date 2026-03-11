from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0005_propertyinquiry_status'),
    ]

    operations = [
        migrations.RenameField(
            model_name='property',
            old_name='owner',
            new_name='driver',
        ),
        migrations.RemoveField(
            model_name='property',
            name='address_line1',
        ),
        migrations.RemoveField(
            model_name='property',
            name='baths',
        ),
        migrations.RemoveField(
            model_name='property',
            name='beds',
        ),
        migrations.RemoveField(
            model_name='property',
            name='city',
        ),
        migrations.RemoveField(
            model_name='property',
            name='price_per_day',
        ),
        migrations.RemoveField(
            model_name='property',
            name='sqft',
        ),
        migrations.RemoveField(
            model_name='property',
            name='state',
        ),
        migrations.RemoveField(
            model_name='property',
            name='zip_code',
        ),
        migrations.AlterField(
            model_name='property',
            name='description',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='property',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='cars/'),
        ),
        migrations.AddField(
            model_name='property',
            name='car_color',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='property',
            name='car_make',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='property',
            name='car_model',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='property',
            name='car_plate',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='property',
            name='departure_time',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AddField(
            model_name='property',
            name='dropoff_point',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='property',
            name='from_city',
            field=models.CharField(default='', max_length=100),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='property',
            name='max_passengers',
            field=models.PositiveSmallIntegerField(default=1),
        ),
        migrations.AddField(
            model_name='property',
            name='pickup_point',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='property',
            name='price_per_seat',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='property',
            name='to_city',
            field=models.CharField(default='', max_length=100),
            preserve_default=False,
        ),
    ]
