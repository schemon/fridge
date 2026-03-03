import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "../hello-api/schema";
import {useAuth} from "react-oidc-context";

console.log(import.meta.env)
const localBaseUrl = ( import.meta.env.VITE_API_BASE_URL || '' ) + '/api/v1/';
console.log(localBaseUrl)

const fetchClient = createFetchClient<paths>({
    baseUrl: localBaseUrl,
});


const $api = createClient(fetchClient);

export const HelloMe = () => {
    const auth = useAuth();

    const { data, error, isLoading } = $api.useQuery(
        "get",
        "/hello/me",
        {
            params: {},
            headers: {
                Authorization: auth.user?.id_token ? `Bearer ${auth.user.id_token}` : undefined,
            },
        },
        {
            enabled: Boolean(auth.user?.id_token),
        }
    );

    if (isLoading || !data) return "Waiting for data...";

    if (error) return `An error occured: ${error}`;

    return <>
        Got hello response: {data.value}
    </>;
};
