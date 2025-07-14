# Generated manually to fix service deletion issue
# This migration changes the service field from CASCADE to SET_NULL
# to prevent appointment deletion when services are removed

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0001_initial'),
        ('organizations', '0005_client_address_client_client_type_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='appointment',
            name='service',
            field=models.ForeignKey(
                null=True, 
                on_delete=django.db.models.deletion.SET_NULL, 
                related_name='appointments', 
                to='organizations.service'
            ),
        ),
        migrations.AlterField(
            model_name='recurringappointment',
            name='service',
            field=models.ForeignKey(
                null=True, 
                on_delete=django.db.models.deletion.SET_NULL, 
                to='organizations.service'
            ),
        ),
    ]