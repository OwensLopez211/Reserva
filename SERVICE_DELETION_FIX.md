# Service Deletion Fix - Preventing Appointment Loss

## Problem
When deleting a service, all associated appointments were also being deleted due to the CASCADE foreign key relationship. This caused unwanted data loss.

## Solution
Changed the foreign key relationship from `CASCADE` to `SET_NULL` to preserve appointments when services are deleted.

## Changes Made

### 1. Backend Model Changes
**File:** `reservaplus_backend/appointments/models.py`

- Changed `service` field in `Appointment` model from `on_delete=models.CASCADE` to `on_delete=models.SET_NULL, null=True`
- Changed `service` field in `RecurringAppointment` model similarly
- Updated `__str__` methods to handle null service cases showing "Servicio eliminado"
- Updated validation methods to handle cases where service might be null

### 2. Database Migration
**File:** `reservaplus_backend/appointments/migrations/0002_alter_service_cascade_to_set_null.py`

- Creates migration to alter the database schema
- Changes both `Appointment.service` and `RecurringAppointment.service` fields

### 3. Backend API Enhancement
**File:** `reservaplus_backend/organizations/views.py`

Enhanced `ServiceViewSet.destroy()` method:
- Added check for existing appointments before deletion
- Returns warning message with appointment count if appointments exist
- Supports `force=true` parameter to bypass warning and proceed with deletion
- Maintains backward compatibility

### 4. Frontend Service Updates
**File:** `reservaplus_frontend/src/services/servicesService.ts`

- Updated `deleteService()` method to handle warning responses
- Added `forceDeleteService()` method for confirmed deletions
- Enhanced error handling for warning responses

### 5. Frontend UI Updates
**File:** `reservaplus_frontend/src/pages/ServicesPage.tsx`

- Enhanced `handleDeleteService()` to show warning dialog
- Two-step deletion process: warning check first, then confirmation
- Improved user experience with detailed information about affected appointments

## How It Works Now

1. **User clicks delete service**
2. **System checks for appointments** - Backend counts associated appointments
3. **If appointments exist:**
   - Shows warning: "Este servicio tiene X cita(s) asociada(s). Al eliminar el servicio, las citas mantendrán su información pero mostrarán 'Servicio eliminado' en lugar del nombre del servicio."
   - User can choose to continue or cancel
4. **If user confirms or no appointments exist:**
   - Service is deleted
   - Appointments remain but show "Servicio eliminado" for the service name
   - All appointment data (date, time, client, professional, price, etc.) is preserved

## Benefits

- **Data Preservation:** Appointments are never lost when services are deleted
- **Audit Trail:** Historical appointments maintain their information
- **User Safety:** Clear warnings prevent accidental data loss
- **Flexibility:** Users can still delete services when needed
- **Backward Compatibility:** Existing functionality remains intact

## Database Migration Required

After deploying these changes, run:
```bash
python manage.py migrate appointments
```

This will apply the database schema changes to allow null service references in appointments.