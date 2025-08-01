# Generated by Django 5.1 on 2025-07-07 04:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0003_organization_onboarding_completed_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='cover_image',
            field=models.URLField(blank=True, help_text='URL de la imagen de portada'),
        ),
        migrations.AddField(
            model_name='organization',
            name='gallery_images',
            field=models.JSONField(blank=True, default=list, help_text='Lista de URLs de imágenes para la galería'),
        ),
        migrations.AddField(
            model_name='organization',
            name='is_featured',
            field=models.BooleanField(default=False, help_text='Aparece en la sección de destacados del marketplace'),
        ),
        migrations.AddField(
            model_name='organization',
            name='logo',
            field=models.URLField(blank=True, help_text='URL del logo de la organización'),
        ),
        migrations.AddField(
            model_name='organization',
            name='rating',
            field=models.DecimalField(decimal_places=2, default=0.0, help_text='Rating promedio basado en reseñas', max_digits=3),
        ),
        migrations.AddField(
            model_name='organization',
            name='total_reviews',
            field=models.PositiveIntegerField(default=0, help_text='Número total de reseñas'),
        ),
    ]
