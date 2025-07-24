# Configuración de Cron Jobs para Pagos Automáticos

Este documento explica cómo configurar cron jobs para que los pagos se procesen automáticamente.

## 🕒 Comandos Disponibles

### 1. Procesamiento de Pagos Automáticos
```bash
# Comando principal para procesar pagos
python manage.py process_automatic_payments

# Opciones disponibles:
--dry-run                 # Solo mostrar qué se procesaría (no hacer pagos reales)
--days-ahead N            # Procesar pagos con N días de anticipación
--force-retry             # Forzar reintento de pagos fallidos
```

### 2. Configuración de MercadoPago
```bash
# Configurar credenciales de MercadoPago
python manage.py setup_mercadopago \
  --access-token "YOUR_ACCESS_TOKEN" \
  --public-key "YOUR_PUBLIC_KEY" \
  --client-id "YOUR_CLIENT_ID" \
  --client-secret "YOUR_CLIENT_SECRET" \
  --webhook-url "https://yourdomain.com/api/payments/webhook/" \
  --sandbox  # o --production
```

## 📅 Configuración de Cron Jobs

### 1. Cron Job Diario (Recomendado)
Procesa pagos que vencen hoy y mañana:

```bash
# Editar crontab
crontab -e

# Agregar esta línea (ejecuta todos los días a las 9:00 AM)
0 9 * * * cd /path/to/reservaplus_backend && /path/to/venv/bin/python manage.py process_automatic_payments --days-ahead 1 >> /var/log/reservaplus_payments.log 2>&1
```

### 2. Cron Job Cada 6 Horas (Para mayor frecuencia)
```bash
# Ejecuta cada 6 horas
0 */6 * * * cd /path/to/reservaplus_backend && /path/to/venv/bin/python manage.py process_automatic_payments >> /var/log/reservaplus_payments.log 2>&1
```

### 3. Cron Job de Limpieza Semanal
```bash
# Procesa webhooks pendientes y reintentos (domingos a las 3:00 AM)
0 3 * * 0 cd /path/to/reservaplus_backend && /path/to/venv/bin/python manage.py process_automatic_payments --force-retry >> /var/log/reservaplus_cleanup.log 2>&1
```

## 🛠️ Scripts de Automatización

### Script de Producción
Crea un archivo `/usr/local/bin/process_payments.sh`:

```bash
#!/bin/bash
# Script para procesamiento automático de pagos

# Configuración
PROJECT_DIR="/path/to/reservaplus_backend"
VENV_DIR="/path/to/venv"
LOG_DIR="/var/log/reservaplus"
PYTHON="$VENV_DIR/bin/python"
MANAGE="$PROJECT_DIR/manage.py"

# Crear directorio de logs si no existe
mkdir -p "$LOG_DIR"

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/payments.log"
}

# Cambiar al directorio del proyecto
cd "$PROJECT_DIR" || {
    log "ERROR: No se pudo acceder al directorio del proyecto: $PROJECT_DIR"
    exit 1
}

# Verificar que el entorno virtual existe
if [ ! -f "$PYTHON" ]; then
    log "ERROR: Python no encontrado en: $PYTHON"
    exit 1
fi

# Verificar que Django está disponible
if ! "$PYTHON" -c "import django" 2>/dev/null; then
    log "ERROR: Django no está disponible en el entorno virtual"
    exit 1
fi

log "🚀 Iniciando procesamiento automático de pagos..."

# Ejecutar comando de procesamiento
if "$PYTHON" "$MANAGE" process_automatic_payments --days-ahead 1; then
    log "✅ Procesamiento de pagos completado exitosamente"
else
    log "❌ Error en el procesamiento de pagos"
    exit 1
fi

log "🏁 Procesamiento finalizado"
```

### Hacer el script ejecutable
```bash
chmod +x /usr/local/bin/process_payments.sh
```

### Actualizar crontab para usar el script
```bash
# Ejecutar script diariamente a las 9:00 AM
0 9 * * * /usr/local/bin/process_payments.sh
```

## 🔍 Monitoreo y Logs

### 1. Revisar Logs de Pagos
```bash
# Ver logs en tiempo real
tail -f /var/log/reservaplus_payments.log

# Ver últimas 50 líneas
tail -50 /var/log/reservaplus_payments.log

# Buscar errores
grep "ERROR\|❌" /var/log/reservaplus_payments.log
```

### 2. Script de Monitoreo
Crea `/usr/local/bin/check_payment_health.sh`:

```bash
#!/bin/bash
# Script para verificar salud del sistema de pagos

PROJECT_DIR="/path/to/reservaplus_backend"
VENV_DIR="/path/to/venv"
PYTHON="$VENV_DIR/bin/python"
MANAGE="$PROJECT_DIR/manage.py"

cd "$PROJECT_DIR"

echo "🏥 Verificando salud del sistema de pagos..."

# Verificar configuración de MercadoPago
echo "📝 Verificando configuración de MercadoPago..."
"$PYTHON" "$MANAGE" setup_mercadopago

# Verificar pagos pendientes
echo "⏰ Verificando pagos pendientes..."
"$PYTHON" "$MANAGE" process_automatic_payments --dry-run

# Verificar webhooks pendientes
echo "🔄 Verificando webhooks pendientes..."
"$PYTHON" -c "
from payments.models import WebhookEvent
from django.utils import timezone
from datetime import timedelta

pending = WebhookEvent.objects.filter(
    status__in=['pending', 'failed'],
    created_at__gte=timezone.now() - timedelta(hours=24)
).count()

print(f'Webhooks pendientes (últimas 24h): {pending}')
"

echo "✅ Verificación completada"
```

### 3. Cron Job de Monitoreo
```bash
# Verificar salud del sistema cada hora
0 * * * * /usr/local/bin/check_payment_health.sh >> /var/log/reservaplus_health.log 2>&1
```

## 🚨 Alertas y Notificaciones

### Script de Alertas por Email
Crea `/usr/local/bin/payment_alerts.sh`:

```bash
#!/bin/bash
# Script para enviar alertas por email sobre pagos fallidos

PROJECT_DIR="/path/to/reservaplus_backend"
VENV_DIR="/path/to/venv"
PYTHON="$VENV_DIR/bin/python"
ADMIN_EMAIL="admin@yourdomain.com"

cd "$PROJECT_DIR"

# Contar pagos fallidos del día
FAILED_COUNT=$("$PYTHON" -c "
from payments.models import Payment
from django.utils import timezone
from datetime import timedelta

failed = Payment.objects.filter(
    mp_status__in=['rejected', 'cancelled'],
    created_at__gte=timezone.now() - timedelta(days=1)
).count()

print(failed)
")

# Contar suscripciones pausadas
PAUSED_COUNT=$("$PYTHON" -c "
from payments.models import SubscriptionPayment

paused = SubscriptionPayment.objects.filter(
    mp_status='paused',
    is_active=False
).count()

print(paused)
")

# Enviar alerta si hay problemas
if [ "$FAILED_COUNT" -gt 0 ] || [ "$PAUSED_COUNT" -gt 0 ]; then
    SUBJECT="🚨 Alerta de Pagos - Reserva+"
    BODY="Alertas del sistema de pagos:

🔴 Pagos fallidos hoy: $FAILED_COUNT
⏸️  Suscripciones pausadas: $PAUSED_COUNT

Por favor revisa el dashboard de administración.
"
    
    echo "$BODY" | mail -s "$SUBJECT" "$ADMIN_EMAIL"
fi
```

### Cron Job de Alertas
```bash
# Enviar alertas cada 4 horas
0 */4 * * * /usr/local/bin/payment_alerts.sh
```

## 🔧 Configuración del Sistema

### 1. Instalar mailutils (para alertas por email)
```bash
# Ubuntu/Debian
sudo apt-get install mailutils

# CentOS/RHEL
sudo yum install mailx
```

### 2. Configurar logrotate para logs
Crea `/etc/logrotate.d/reservaplus`:

```
/var/log/reservaplus*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

### 3. Verificar configuración de cron
```bash
# Ver crontab actual
crontab -l

# Verificar que el servicio cron está corriendo
sudo systemctl status cron

# Ver logs de cron
sudo tail -f /var/log/cron
```

## 📋 Checklist de Deployment

- [ ] Configurar credenciales de MercadoPago
- [ ] Configurar webhooks en dashboard de MercadoPago
- [ ] Crear directorios de logs
- [ ] Configurar scripts de automatización
- [ ] Establecer cron jobs
- [ ] Configurar monitoreo y alertas
- [ ] Probar en modo dry-run
- [ ] Configurar logrotate
- [ ] Documentar procedimientos de emergencia

## 🆘 Procedimientos de Emergencia

### Si los pagos automáticos fallan:
1. Verificar configuración: `python manage.py setup_mercadopago`
2. Ejecutar en modo dry-run: `python manage.py process_automatic_payments --dry-run`
3. Revisar logs: `tail -100 /var/log/reservaplus_payments.log`
4. Verificar conectividad con MercadoPago
5. Reintentar pagos fallidos: `python manage.py process_automatic_payments --force-retry`

### Si hay problemas con webhooks:
1. Verificar configuración de webhook en MercadoPago
2. Probar endpoint manualmente: `curl -X POST https://yourdomain.com/api/payments/webhook/`
3. Revisar logs de webhooks en Django Admin
4. Reprocesar webhooks pendientes

---

**¡Importante!** Siempre prueba en un entorno de staging antes de implementar en producción.