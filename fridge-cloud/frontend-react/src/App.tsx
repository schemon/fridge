import './App.css'
import {Hello} from "./components/Hello.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";
import {HelloMe} from "./components/HelloMe.tsx";



function App() {

    const auth = useAuth();

    const signOutRedirect = () => {

        auth.removeUser();

        const clientId = import.meta.env.VITE_AUTH_CLIENT_ID;
        const cognitoDomain = import.meta.env.VITE_AUTH_DOMAIN;
        const logoutUri = window.location.origin;
        window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    };

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false
            }
        }
    });

    if (auth.isAuthenticated) {
        return (
            <QueryClientProvider client={queryClient}>
                <HelloMe/>
                <button onClick={() => signOutRedirect()}>Sign out!</button>
            </QueryClientProvider>
        )
    } else if (auth.isLoading) {
        return <div>Loading...</div>;
    } else {
        return (
            <QueryClientProvider client={queryClient}>
                <div>
                    <Hello/>
                    <button onClick={() => auth.signinRedirect()}>Sign in</button>
                    <button onClick={() => signOutRedirect()}>Sign out</button>
                </div>
            </QueryClientProvider>
        );
    }
}

export default App
