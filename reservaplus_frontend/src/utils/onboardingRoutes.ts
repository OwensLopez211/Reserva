// src/utils/onboardingRoutes.ts
// Utilidades para manejar rutas de onboarding
export const checkUserNeedsOnboarding = async (): Promise<boolean> => {
    try {
      const [orgResponse, profResponse, servResponse] = await Promise.all([
        fetch('/api/organizations/me/'),
        fetch('/api/organizations/professionals/'),
        fetch('/api/organizations/services/')
      ])
  
      if (!orgResponse.ok) return true
  
      const [orgData, profData, servData] = await Promise.all([
        orgResponse.json(),
        profResponse.json(),
        servResponse.json()
      ])
  
      // Verificar si tiene configuración completa
      const hasCompleteSetup = orgData && 
                              profData.results?.length > 0 && 
                              servData.results?.length > 0
  
      return !hasCompleteSetup
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      return true // En caso de error, asumir que necesita onboarding
    }
  }
  
  export const getOnboardingProgress = async (): Promise<{
    step: number
    completed: boolean[]
  }> => {
    try {
      const [orgResponse, profResponse, servResponse] = await Promise.all([
        fetch('/api/organizations/me/'),
        fetch('/api/organizations/professionals/'),
        fetch('/api/organizations/services/')
      ])
  
      const hasOrg = orgResponse.ok
      const hasProf = profResponse.ok && (await profResponse.json()).results?.length > 0
      const hasServ = servResponse.ok && (await servResponse.json()).results?.length > 0
  
      const completed = [true, hasOrg, hasProf, hasServ, false, false] // Welcome, Org, Prof, Serv, Config, Complete
      
      let currentStep = 0
      for (let i = 0; i < completed.length; i++) {
        if (!completed[i]) {
          currentStep = i
          break
        }
      }
  
      return { step: currentStep, completed }
    } catch (error) {
      return { step: 1, completed: [true, false, false, false, false, false] }
    }
  }