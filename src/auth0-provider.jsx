import { Auth0Provider } from '@auth0/auth0-react';

const Auth0ProviderWithRedirectCallback = ({ children }) => {
  const onRedirectCallback = (appState) => {
    window.history.replaceState({}, document.title, appState?.returnTo || window.location.pathname);
  };

  return (
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithRedirectCallback;
