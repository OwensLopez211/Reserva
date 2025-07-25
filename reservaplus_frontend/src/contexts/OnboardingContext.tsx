// src/contexts/OnboardingContext.tsx - VERSIÓN ALINEADA CON BACKEND REFACTORIZADO

import React, { createContext, useReducer, useContext, ReactNode } from 'react'

// Tipos de datos para cada paso del onboarding
export interface Plan {
  id: string
  name: string
  price_monthly: number
  price_yearly?: number
  [key: string]: any
}

export interface Service {
  name: string
  description?: string
  category?: string
  duration_minutes: number
  price: number
  buffer_time_before?: number
  buffer_time_after?: number
  is_active?: boolean
  requires_preparation?: boolean
}

export interface TeamMember {
  name: string
  email: string
  phone: string
  role: 'owner' | 'professional' | 'reception' | 'staff'
  specialty?: string
  is_professional?: boolean
  color_code?: string
  accepts_walk_ins?: boolean
}

export interface RegistrationData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  organizationName: string
  industryTemplate: string
  businessPhone: string
  address: string
  city: string
  country: string
  acceptedTerms: boolean
  acceptedPrivacy: boolean
}

interface OnboardingState {
  currentStep: number
  plan: Plan | null
  services: Service[]
  team: TeamMember[]
  registration: Partial<RegistrationData>
}

const initialState: OnboardingState = {
  currentStep: 0,
  plan: null,
  services: [],
  team: [],
  registration: {},
}

type Action =
  | { type: 'SET_PLAN'; payload: Plan }
  | { type: 'SET_SERVICES'; payload: Service[] }
  | { type: 'SET_TEAM'; payload: TeamMember[] }
  | { type: 'SET_REGISTRATION'; payload: Partial<RegistrationData> }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'RESET_ONBOARDING' }

function onboardingReducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case 'SET_PLAN':
      return { ...state, plan: action.payload }
    case 'SET_SERVICES':
      return { ...state, services: action.payload }
    case 'SET_TEAM':
      return { ...state, team: action.payload }
    case 'SET_REGISTRATION':
      return { ...state, registration: { ...state.registration, ...action.payload } }
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
    case 'RESET_ONBOARDING':
      return initialState
    default:
      return state
  }
}

interface OnboardingContextProps extends OnboardingState {
  setPlan: (plan: Plan) => void
  setServices: (services: Service[]) => void
  setTeam: (team: TeamMember[]) => void
  setRegistration: (registration: Partial<RegistrationData>) => void
  setStep: (step: number) => void
  resetOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextProps | undefined>(undefined)

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState)

  const setPlan = (plan: Plan) => dispatch({ type: 'SET_PLAN', payload: plan })
  const setServices = (services: Service[]) => dispatch({ type: 'SET_SERVICES', payload: services })
  const setTeam = (team: TeamMember[]) => dispatch({ type: 'SET_TEAM', payload: team })
  const setRegistration = (registration: Partial<RegistrationData>) => dispatch({ type: 'SET_REGISTRATION', payload: registration })
  const setStep = (step: number) => dispatch({ type: 'SET_STEP', payload: step })
  const resetOnboarding = () => dispatch({ type: 'RESET_ONBOARDING' })

  return (
    <OnboardingContext.Provider
      value={{
        ...state,
        setPlan,
        setServices,
        setTeam,
        setRegistration,
        setStep,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding debe usarse dentro de un OnboardingProvider')
  }
  return context
}