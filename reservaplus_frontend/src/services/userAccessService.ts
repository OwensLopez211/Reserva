// src/services/userAccessService.ts
// Service to validate user access and handle redirects based on user state

interface UserAccessValidationRequest {
  path: string;
}

interface UserAccessValidationResponse {
  accessGranted: boolean;
  userState: 'new_user' | 'incomplete_onboarding' | 'completed_onboarding';
  redirect?: string;
  userProfile?: {
    id: string;
    email: string;
    role: string;
    organization_id: string;
    organization_name: string;
    subscription_status?: string;
  };
  userInfo?: {
    id: string;
    email: string;
  };
  organizationData?: {
    id: string;
    name: string;
    role: string;
    subscription_status: string;
  };
  message: string;
}

class UserAccessService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_GATEWAY_URL || '';
  }

  /**
   * Validates if user can access a specific path
   * @param path - The path the user is trying to access
   * @returns Promise with access validation result
   */
  async validateUserAccess(path: string): Promise<UserAccessValidationResponse> {
    try {
      console.log('🔍 UserAccessService: Validating access for path:', path);

      // Get the current user token from Cognito
      const token = await this.getCurrentUserToken();
      
      if (!token) {
        return {
          accessGranted: false,
          userState: 'new_user',
          redirect: '/login',
          message: 'User not authenticated'
        };
      }

      const response = await fetch(`${this.baseUrl}/auth/validate-access?path=${encodeURIComponent(path)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ UserAccessService: Access validation result:', result);
      
      return result;

    } catch (error) {
      console.error('❌ UserAccessService: Error validating access:', error);
      
      // Return a fallback response on error
      return {
        accessGranted: false,
        userState: 'new_user',
        redirect: '/login',
        message: 'Error validating user access'
      };
    }
  }

  /**
   * Get current user authentication token from Cognito
   */
  private async getCurrentUserToken(): Promise<string | null> {
    try {
      // Import NativeCognitoService dynamically to avoid circular dependencies
      const { NativeCognitoService } = await import('./nativeCognitoService');
      const cognitoService = new NativeCognitoService();
      
      // Check if user is authenticated
      if (!cognitoService.isAuthenticated()) {
        console.log('🔍 UserAccessService: User not authenticated in Cognito');
        return null;
      }

      // Get the access token
      const accessToken = cognitoService.getAccessToken();
      
      if (!accessToken) {
        console.log('🔍 UserAccessService: No access token found');
        return null;
      }

      // Verify token is not expired
      if (this.isTokenExpired(accessToken)) {
        console.log('⚠️ UserAccessService: Token is expired');
        return null;
      }

      return accessToken;

    } catch (error) {
      console.error('❌ UserAccessService: Error getting user token:', error);
      return null;
    }
  }

  /**
   * Check if JWT token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp < now;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  }

  /**
   * Get dashboard path - same for all roles
   * The dashboard component renders different content based on user role
   */
  public getDashboardPathByRole(role: string): string {
    // All users go to the same dashboard URL
    // The dashboard component itself handles role-based rendering
    return '/app/dashboard';
  }

  /**
   * Check if path is an onboarding path
   */
  public isOnboardingPath(path: string): boolean {
    return path.startsWith('/onboarding');
  }

  /**
   * Check if path is a dashboard path
   */
  public isDashboardPath(path: string): boolean {
    return path.startsWith('/app/dashboard') || path.startsWith('/app/');
  }

  /**
   * Handle user redirect based on validation response
   */
  public handleUserRedirect(validationResponse: UserAccessValidationResponse, currentPath: string): string | null {
    const { accessGranted, redirect, userState } = validationResponse;

    // If access is granted, no redirect needed
    if (accessGranted) {
      console.log('✅ UserAccessService: Access granted, no redirect needed');
      return null;
    }

    // If there's a specific redirect, use it
    if (redirect) {
      console.log(`🔄 UserAccessService: Redirecting to ${redirect} due to ${userState} state`);
      return redirect;
    }

    // Fallback redirects based on user state
    switch (userState) {
      case 'new_user':
        return '/onboarding/plan';
      case 'incomplete_onboarding':
        return '/onboarding/setup';
      case 'completed_onboarding':
        return this.getDashboardPathByRole(validationResponse.userProfile?.role || 'staff');
      default:
        return '/login';
    }
  }
}

export const userAccessService = new UserAccessService();
export default userAccessService;