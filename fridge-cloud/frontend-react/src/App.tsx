import { useAuth } from "react-oidc-context";
import { FridgeApp } from "./components/FridgeApp";
import { setAuthToken } from "./fridge-api/client";

function App() {
  const auth = useAuth();

  setAuthToken(auth.user?.id_token ?? undefined);

  if (auth.isLoading) {
    return <div style={{ color: '#555', padding: 40 }}>Loading...</div>;
  }

  if (!auth.isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <span style={{ fontSize: 24, fontWeight: 700 }}>fridge</span>
        <button onClick={() => auth.signinRedirect()}>Sign in</button>
      </div>
    );
  }

  return <FridgeApp />;
}

export default App;
