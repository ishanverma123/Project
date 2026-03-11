from django.db import migrations


def map_roles_forward(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')
    CustomUser.objects.filter(role='tenant').update(role='traveller')
    CustomUser.objects.filter(role='landlord').update(role='driver')


def map_roles_backward(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')
    CustomUser.objects.filter(role='traveller').update(role='tenant')
    CustomUser.objects.filter(role='driver').update(role='landlord')


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_carpool_profile_fields'),
    ]

    operations = [
        migrations.RunPython(map_roles_forward, map_roles_backward),
    ]
