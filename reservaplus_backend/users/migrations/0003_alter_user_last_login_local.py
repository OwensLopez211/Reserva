# Generated by Django 4.2.7 on 2025-06-29 08:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_last_login_local'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='last_login_local',
            field=models.CharField(blank=True, help_text='Último login en hora local de Chile', max_length=50, null=True),
        ),
    ]
