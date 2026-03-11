from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0003_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='booking',
            name='start_date',
        ),
        migrations.RemoveField(
            model_name='booking',
            name='end_date',
        ),
        migrations.AlterField(
            model_name='booking',
            name='property',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookings', to='properties.property'),
        ),
        migrations.AlterField(
            model_name='booking',
            name='status',
            field=models.CharField(default='confirmed', max_length=20),
        ),
        migrations.AlterField(
            model_name='booking',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ride_bookings', to='users.customuser'),
        ),
        migrations.AddField(
            model_name='booking',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='booking',
            name='passenger_count',
            field=models.PositiveSmallIntegerField(default=1),
        ),
    ]
