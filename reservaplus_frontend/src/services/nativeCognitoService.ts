// Native Cognito service without Amplify
import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
  GlobalSignOutCommand
} from '@aws-sdk/client-cognito-identity-provider'

interface CognitoConfig {
  region: string
  userPoolId: string
  clientId: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface SignupData {
  email: string
  password: string
  name: string
}

interface AuthTokens {
  accessToken: string
  idToken: string
  refreshToken: string
}

interface UserInfo {
  email: string
  name: string
  sub: string
}

export class NativeCognitoService {
  private client: CognitoIdentityProviderClient
  private config: CognitoConfig

  constructor() {
    this.config = {
      region: import.meta.env.VITE_AWS_REGION,
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      clientId: import.meta.env.VITE_COGNITO_CLIENT_ID
    }

    this.client = new CognitoIdentityProviderClient({
      region: this.config.region
    })
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.config.clientId,
        AuthParameters: {
          USERNAME: credentials.email,
          PASSWORD: credentials.password
        }
      })

      const response = await this.client.send(command)

      if (response.ChallengeName) {
        throw new Error(`Authentication challenge required: ${response.ChallengeName}`)
      }

      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed')
      }

      const tokens = {
        accessToken: response.AuthenticationResult.AccessToken!,
        idToken: response.AuthenticationResult.IdToken!,
        refreshToken: response.AuthenticationResult.RefreshToken!
      }

      // Store tokens
      this.storeTokens(tokens)
      
      return tokens
    } catch (error) {
      console.error('Login error:', error)
      throw new Error('Invalid email or password')
    }
  }

  // Sign up user (for future use)
  async signup(userData: SignupData): Promise<void> {
    try {
      const command = new SignUpCommand({
        ClientId: this.config.clientId,
        Username: userData.email,
        Password: userData.password,
        UserAttributes: [
          {
            Name: 'email',
            Value: userData.email
          },
          {
            Name: 'name',
            Value: userData.name
          }
        ]
      })

      await this.client.send(command)
    } catch (error) {
      console.error('Signup error:', error)
      throw new Error('Failed to create account')
    }
  }

  // Confirm signup
  async confirmSignup(email: string, code: string): Promise<void> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.config.clientId,
        Username: email,
        ConfirmationCode: code
      })

      await this.client.send(command)
    } catch (error) {
      console.error('Confirm signup error:', error)
      throw new Error('Invalid confirmation code')
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.config.clientId,
        Username: email
      })

      await this.client.send(command)
    } catch (error) {
      console.error('Forgot password error:', error)
      throw new Error('Failed to send reset code')
    }
  }

  // Confirm forgot password
  async confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.config.clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword
      })

      await this.client.send(command)
    } catch (error) {
      console.error('Confirm forgot password error:', error)
      throw new Error('Failed to reset password')
    }
  }

  // Get current user
  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const accessToken = this.getAccessToken()
      if (!accessToken) return null

      const command = new GetUserCommand({
        AccessToken: accessToken
      })

      const response = await this.client.send(command)
      
      return {
        email: response.UserAttributes?.find(attr => attr.Name === 'email')?.Value || '',
        name: response.UserAttributes?.find(attr => attr.Name === 'name')?.Value || '',
        sub: response.UserAttributes?.find(attr => attr.Name === 'sub')?.Value || ''
      }
    } catch (error) {
      console.error('Get current user error:', error)
      this.clearTokens()
      return null
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const accessToken = this.getAccessToken()
      if (accessToken) {
        const command = new GlobalSignOutCommand({
          AccessToken: accessToken
        })
        await this.client.send(command)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearTokens()
    }
  }

  // Token management
  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem('cognito_access_token', tokens.accessToken)
    localStorage.setItem('cognito_id_token', tokens.idToken)
    localStorage.setItem('cognito_refresh_token', tokens.refreshToken)
  }

  getAccessToken(): string | null {
    return localStorage.getItem('cognito_access_token')
  }

  getIdToken(): string | null {
    return localStorage.getItem('cognito_id_token')
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('cognito_refresh_token')
  }

  private clearTokens(): void {
    localStorage.removeItem('cognito_access_token')
    localStorage.removeItem('cognito_id_token')
    localStorage.removeItem('cognito_refresh_token')
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const idToken = this.getIdToken()
    if (!idToken) return false

    try {
      // Parse JWT to check expiration
      const payload = JSON.parse(atob(idToken.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      
      return payload.exp > now
    } catch {
      return false
    }
  }

  // Get user info from ID token
  getUserInfoFromToken(): UserInfo | null {
    const idToken = this.getIdToken()
    if (!idToken) return null

    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]))
      return {
        email: payload.email || '',
        name: payload.name || '',
        sub: payload.sub || ''
      }
    } catch {
      return null
    }
  }

  // Refresh tokens (basic implementation)
  async refreshTokens(): Promise<void> {
    // This would implement token refresh logic
    // For now, we'll rely on the backend to handle expired tokens
    console.log('Token refresh not implemented')
  }
}