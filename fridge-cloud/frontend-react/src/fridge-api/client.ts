import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./schema";

const baseUrl = (import.meta.env.VITE_API_BASE_URL || '') + '/api/v1';

let _token: string | undefined;

const fetchClient = createFetchClient<paths>({ baseUrl });

fetchClient.use({
  async onRequest({ request }) {
    if (_token) {
      request.headers.set("Authorization", `Bearer ${_token}`);
    }
    return request;
  },
});

export const $api = createClient(fetchClient);

export function setAuthToken(token: string | undefined) {
  _token = token;
}
