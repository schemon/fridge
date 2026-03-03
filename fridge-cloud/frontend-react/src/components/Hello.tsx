import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "../hello-api/schema";

console.log(import.meta.env)
const localBaseUrl = ( import.meta.env.VITE_API_BASE_URL || '' ) + '/api/v1/';
console.log(localBaseUrl)

const fetchClient = createFetchClient<paths>({
    baseUrl: localBaseUrl,
});


const $api = createClient(fetchClient);

export const Hello = () => {
    const { data, error, isLoading } = $api.useQuery(
        "get",
        "/hello",
        {
            params: {
            },
        },
    );

    if (isLoading || !data) return "Waiting for data...";

    if (error) return `An error occured: ${error}`;

    return <>
        Got hello response: {data.value}
    </>;
};
