// src/config/oidc.ts
export const oidcConfig = {
  authority: `https://cognito-idp.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${import.meta.env.VITE_COGNITO_USER_POOL_ID}`,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: "code",
  scope: "email openid phone profile",
  automaticSilentRenew: true,
  includeIdTokenInSilentRenew: true,
  loadUserInfo: true,
};

export const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;