# Generated manually for ClientNote and ClientFile models

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_user_requires_password_change_user_temp_password'),
        ('organizations', '0005_client_address_client_client_type_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ClientNote',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200, verbose_name='Título')),
                ('content', models.TextField(verbose_name='Contenido')),
                ('category', models.CharField(choices=[('general', 'General'), ('medical', 'Médico'), ('preferences', 'Preferencias'), ('important', 'Importante'), ('follow_up', 'Seguimiento')], default='general', max_length=20, verbose_name='Categoría')),
                ('is_private', models.BooleanField(default=False, help_text='Solo visible para administradores', verbose_name='Nota Privada')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('client', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='client_notes', to='organizations.client')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_client_notes', to='users.user')),
                ('organization', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='client_notes', to='organizations.organization')),
            ],
            options={
                'db_table': 'organizations_client_note',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ClientFile',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255, verbose_name='Nombre del Archivo')),
                ('file_path', models.CharField(max_length=500, verbose_name='Ruta del Archivo')),
                ('file_type', models.CharField(max_length=50, verbose_name='Tipo de Archivo')),
                ('file_size', models.PositiveIntegerField(verbose_name='Tamaño del Archivo (bytes)')),
                ('description', models.TextField(blank=True, verbose_name='Descripción')),
                ('category', models.CharField(choices=[('document', 'Documento'), ('image', 'Imagen'), ('medical', 'Médico'), ('other', 'Otro')], default='document', max_length=20, verbose_name='Categoría')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('client', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='client_files', to='organizations.client')),
                ('organization', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='client_files', to='organizations.organization')),
                ('uploaded_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='uploaded_client_files', to='users.user')),
            ],
            options={
                'db_table': 'organizations_client_file',
                'ordering': ['-uploaded_at'],
            },
        ),
    ]