// src/services/directCognitoService.ts
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js'

interface CognitoConfig {
  userPoolId: string
  clientId: string
}

export interface CognitoTokens {
  accessToken: string
  idToken: string
  refreshToken: string
}

export interface AuthResult {
  user: any
  tokens: CognitoTokens
}

class DirectCognitoService {
  private userPool: CognitoUserPool
  private config: CognitoConfig

  constructor() {
    this.config = {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
      clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || ''
    }

    if (!this.config.userPoolId || !this.config.clientId) {
      throw new Error('Missing Cognito configuration. Check your .env file.')
    }

    this.userPool = new CognitoUserPool({
      UserPoolId: this.config.userPoolId,
      ClientId: this.config.clientId,
    })
  }

  // Login with email and password
  async login(email: string, password: string): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      })

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool,
      })

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result: CognitoUserSession) => {
          const tokens = {
            accessToken: result.getAccessToken().getJwtToken(),
            idToken: result.getIdToken().getJwtToken(),
            refreshToken: result.getRefreshToken().getToken(),
          }

          // Get user attributes
          cognitoUser.getUserAttributes((err, attributes) => {
            if (err) {
              reject(err)
              return
            }

            const userInfo = this.parseUserAttributes(attributes || [])
            resolve({
              user: {
                ...userInfo,
                username: email,
              },
              tokens,
            })
          })
        },
        onFailure: (err) => {
          console.error('Login failed:', err)
          reject(new Error(this.getReadableError(err.message)))
        },
        newPasswordRequired: (userAttributes) => {
          console.log('New password required:', userAttributes)
          reject(new Error('Se requiere nueva contraseña. Contacta al administrador.'))
        },
        mfaRequired: () => {
          reject(new Error('MFA requerido pero no implementado aún'))
        },
      })
    })
  }

  // Get current session
  async getCurrentSession(): Promise<CognitoUserSession | null> {
    return new Promise((resolve) => {
      const cognitoUser = this.userPool.getCurrentUser()
      
      if (!cognitoUser) {
        resolve(null)
        return
      }

      cognitoUser.getSession((err: any, session: CognitoUserSession) => {
        if (err || !session || !session.isValid()) {
          resolve(null)
          return
        }
        resolve(session)
      })
    })
  }

  // Get current user info
  async getCurrentUser(): Promise<any> {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser()
      
      if (!cognitoUser) {
        resolve(null)
        return
      }

      cognitoUser.getSession((err: any, session: CognitoUserSession) => {
        if (err || !session || !session.isValid()) {
          resolve(null)
          return
        }

        cognitoUser.getUserAttributes((err, attributes) => {
          if (err) {
            reject(err)
            return
          }

          const userInfo = this.parseUserAttributes(attributes || [])
          resolve({
            ...userInfo,
            username: cognitoUser.getUsername(),
          })
        })
      })
    })
  }

  // Refresh token
  async refreshSession(): Promise<CognitoTokens | null> {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser()
      
      if (!cognitoUser) {
        resolve(null)
        return
      }

      cognitoUser.getSession((err: any, session: CognitoUserSession) => {
        if (err) {
          reject(err)
          return
        }

        if (!session || !session.isValid()) {
          resolve(null)
          return
        }

        const refreshToken = session.getRefreshToken()
        
        cognitoUser.refreshSession(refreshToken, (err, newSession) => {
          if (err) {
            reject(err)
            return
          }

          resolve({
            accessToken: newSession.getAccessToken().getJwtToken(),
            idToken: newSession.getIdToken().getJwtToken(),
            refreshToken: newSession.getRefreshToken().getToken(),
          })
        })
      })
    })
  }

  // Logout
  async logout(): Promise<void> {
    return new Promise((resolve) => {
      const cognitoUser = this.userPool.getCurrentUser()
      
      if (cognitoUser) {
        cognitoUser.signOut()
      }
      
      // Clear local storage
      localStorage.clear()
      resolve()
    })
  }

  // Get access token
  async getAccessToken(): Promise<string | null> {
    const session = await this.getCurrentSession()
    return session ? session.getAccessToken().getJwtToken() : null
  }

  // Get ID token
  async getIdToken(): Promise<string | null> {
    const session = await this.getCurrentSession()
    return session ? session.getIdToken().getJwtToken() : null
  }

  // Parse user attributes from Cognito format
  private parseUserAttributes(attributes: any[]): any {
    const userInfo: any = {}
    
    attributes.forEach((attr) => {
      switch (attr.getName()) {
        case 'email':
          userInfo.email = attr.getValue()
          break
        case 'given_name':
          userInfo.first_name = attr.getValue()
          break
        case 'family_name':
          userInfo.last_name = attr.getValue()
          break
        case 'phone_number':
          userInfo.phone = attr.getValue()
          break
        case 'custom:role':
          userInfo.role = attr.getValue()
          break
        case 'custom:organization_id':
          userInfo.organization_id = attr.getValue()
          break
        case 'custom:organization_name':
          userInfo.organization_name = attr.getValue()
          break
        case 'custom:is_professional':
          userInfo.is_professional = attr.getValue() === 'true'
          break
        case 'custom:is_active_in_org':
          userInfo.is_active_in_org = attr.getValue() === 'true'
          break
        default:
          // Handle other custom attributes
          if (attr.getName().startsWith('custom:')) {
            const key = attr.getName().replace('custom:', '')
            userInfo[key] = attr.getValue()
          }
      }
    })

    // Generate full name if we have first and last name
    if (userInfo.first_name && userInfo.last_name) {
      userInfo.full_name = `${userInfo.first_name} ${userInfo.last_name}`
    }

    return userInfo
  }

  // Convert Cognito error messages to user-friendly messages
  private getReadableError(errorMessage: string): string {
    if (errorMessage.includes('User does not exist')) {
      return 'Usuario no encontrado'
    }
    if (errorMessage.includes('Incorrect username or password')) {
      return 'Usuario o contraseña incorrectos'
    }
    if (errorMessage.includes('User is not confirmed')) {
      return 'Usuario no confirmado. Revisa tu email.'
    }
    if (errorMessage.includes('Password attempts exceeded')) {
      return 'Demasiados intentos fallidos. Intenta más tarde.'
    }
    if (errorMessage.includes('Network error')) {
      return 'Error de conexión. Verifica tu internet.'
    }
    
    return 'Error de autenticación. Intenta nuevamente.'
  }
}

export const directCognitoService = new DirectCognitoService()
export default directCognitoService