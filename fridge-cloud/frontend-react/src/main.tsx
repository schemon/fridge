import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from 'react-oidc-context';
import './index.css';
import App from './App';

const cognitoAuthConfig = {
  authority: import.meta.env.VITE_ISSUER_URI,
  client_id: import.meta.env.VITE_AUTH_CLIENT_ID,
  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "email openid profile",
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>,
);
