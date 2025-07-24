# 🚀 Instrucciones de Despliegue - ReservaPlus AWS

## Problema Identificado
El script bash no puede acceder a las credenciales AWS configuradas en PowerShell debido a que están en diferentes entornos.

## Solución: Ejecutar desde PowerShell

### Opción 1: Ejecutar Script PowerShell (Recomendado)

1. **Abre PowerShell como Administrador** en Windows (no WSL)

2. **Navega al directorio del proyecto:**
   ```powershell
   cd "C:\Users\Owens\Desktop\Codigo\Proyectos con Clientes\Reserva\aws-lambda"
   ```

3. **Ejecuta el script PowerShell:**
   ```powershell
   .\scripts\deploy-from-powershell.ps1
   ```

### Opción 2: Ejecutar Script Bash desde PowerShell

Si prefieres usar el script bash original:

1. **Abre PowerShell como Administrador**

2. **Navega al directorio:**
   ```powershell
   cd "C:\Users\Owens\Desktop\Codigo\Proyectos con Clientes\Reserva\aws-lambda"
   ```

3. **Ejecuta el script bash:**
   ```powershell
   bash .\scripts\deploy-onboarding.sh
   ```

### Opción 3: Configurar Credenciales en WSL

Si quieres quedarte en WSL, exporta las credenciales manualmente:

1. **En PowerShell, obtén tus credenciales:**
   ```powershell
   aws configure list
   ```

2. **En WSL bash, exporta las credenciales:**
   ```bash
   export AWS_ACCESS_KEY_ID=tu_access_key
   export AWS_SECRET_ACCESS_KEY=tu_secret_key
   export AWS_DEFAULT_REGION=sa-east-1
   ```

3. **Ejecuta el script:**
   ```bash
   cd /mnt/c/Users/Owens/Desktop/Codigo/Proyectos\ con\ Clientes/Reserva/aws-lambda
   ./scripts/deploy-onboarding.sh
   ```

## ¿Qué hará el despliegue?

1. ✅ Crear bucket S3 temporal para artefactos
2. ✅ Empaquetar funciones Lambda con dependencias
3. ✅ Desplegar stack CloudFormation completo
4. ✅ Crear tabla DynamoDB `reservaplus-dev`
5. ✅ Poblar datos iniciales de planes
6. ✅ Configurar API Gateway con CORS
7. ✅ Crear Cognito User Pool

## Después del despliegue

Cuando termine exitosamente, verás algo como:

```
🎉 Deployment completed successfully!

📋 Environment Configuration:
  API Gateway URL: https://abc123.execute-api.sa-east-1.amazonaws.com/dev
  Cognito User Pool ID: sa-east-1_xxxxxxxxx
  Cognito Client ID: xxxxxxxxxxxxxxxxxxxxxxxxxx
  DynamoDB Table: reservaplus-dev

🔧 Update your .env file with:
VITE_API_GATEWAY_URL=https://abc123.execute-api.sa-east-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=sa-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AWS_REGION=sa-east-1
```

**Copia esos valores a tu archivo `.env` del frontend.**

## Comando Recomendado

**Desde PowerShell (como Administrador):**
```powershell
cd "C:\Users\Owens\Desktop\Codigo\Proyectos con Clientes\Reserva\aws-lambda"
.\scripts\deploy-from-powershell.ps1
```