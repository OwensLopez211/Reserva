# Testing Public Booking - Quick Setup Guide

## Issue Found
The error is occurring because you're testing with organization slug `"asdasd"` which doesn't exist in the database.

## Quick Fix

### 1. First, populate test organizations in your database:

```bash
cd reservaplus_backend
python manage.py populate_marketplace  # Creates 4 organizations with full test data
```

### 2. Use valid organization slugs for testing:

Instead of testing with:
```
POST /public/booking/org/asdasd/book/
```

Use one of these valid slugs:
```
POST /public/booking/org/salon-bella-vista/book/
POST /public/booking/org/clinica-dental-smilecenter/book/
POST /public/booking/org/fitlife-personal-training/book/
POST /public/booking/org/spa-relax-wellness/book/
```

### 3. Test Data Available

After running `populate_marketplace`, you'll have:

**Salon Bella Vista** (`salon-bella-vista`)
- 2 professionals: Ana García, Carlos Ruiz
- 3 services: Corte de Cabello, Coloración, Tratamiento Capilar

**Clínica Dental SmileCenter** (`clinica-dental-smilecenter`)  
- 2 professionals: Dr. María López, Dr. Juan Martínez
- 3 services: Limpieza Dental, Blanqueamiento, Extracción

**FitLife Personal Training** (`fitlife-personal-training`)
- 2 professionals: Pedro Sánchez, Laura Torres  
- 3 services: Entrenamiento Personal, Evaluación Física, Plan Nutricional

**Spa Relax & Wellness** (`spa-relax-wellness`)
- 2 professionals: Carmen Vega, Ricardo Molina
- 3 services: Masaje Relajante, Facial Hidratante, Manicure

### 4. Example Valid Booking Request

```json
POST /public/booking/org/salon-bella-vista/book/

{
  "booking_type": "guest",
  "service_id": "<valid-service-id>",
  "professional_id": "<valid-professional-id>", 
  "start_datetime": "2025-08-02T10:00:00-04:00",
  "client_data": {
    "first_name": "Owens",
    "last_name": "López García", 
    "email": "owenslopez211@gmail.com",
    "phone": "983612026",
    "notes": ""
  },
  "marketing_consent": false
}
```

### 5. Get Valid Service and Professional IDs

First call:
```
GET /public/booking/org/salon-bella-vista/
```

This will return the organization details with all services and professionals, including their IDs.

### 6. Current Debug Output

The system now provides detailed debugging info. When you use an invalid organization slug, you'll see:

```
❌ Organization not found with slug: 'asdasd'
💡 Available organizations: ['salon-bella-vista', 'clinica-dental-smilecenter', ...]
```

## Next Steps

1. Run the populate command
2. Get valid organization, service, and professional IDs  
3. Test with a valid organization slug
4. The booking should work properly

The detailed debug logs will show exactly where any remaining issues occur in the booking process.