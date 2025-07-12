// src/hooks/useOrganizationSetup.ts
// Hook para verificar el estado de configuración de la organización
import { useState, useEffect } from 'react'
import { api } from '../services/api'

interface SetupStatus {
  hasOrganization: boolean
  hasProfessionals: boolean
  hasServices: boolean
  organizationData?: any
  professionalsCount: number
  servicesCount: number
}

export const useOrganizationSetup = () => {
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkSetupStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificar organización
      const orgResponse = await api.get('/api/organizations/me/')
      const organizationData = orgResponse.data

      // Verificar profesionales
      const profResponse = await api.get('/api/organizations/professionals/')
      const professionals = profResponse.data

      // Verificar servicios
      const servResponse = await api.get('/api/organizations/services/')
      const services = servResponse.data

      const status: SetupStatus = {
        hasOrganization: !!organizationData,
        hasProfessionals: professionals.results?.length > 0,
        hasServices: services.results?.length > 0,
        organizationData,
        professionalsCount: professionals.results?.length || 0,
        servicesCount: services.results?.length || 0
      }

      setSetupStatus(status)
    } catch (err) {
      console.error('Error checking setup status:', err)
      setError('Error al verificar el estado de configuración')
      
      // Si hay error, asumir que necesita configuración
      setSetupStatus({
        hasOrganization: false,
        hasProfessionals: false,
        hasServices: false,
        professionalsCount: 0,
        servicesCount: 0
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const isSetupComplete = setupStatus ? 
    setupStatus.hasOrganization && setupStatus.hasProfessionals && setupStatus.hasServices : 
    false

  return {
    setupStatus,
    loading,
    error,
    isSetupComplete,
    recheckSetup: checkSetupStatus
  }
}