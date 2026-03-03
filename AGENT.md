# Fridge

## Build

All fridge-cloud components (backend, frontend) depend on generated API clients from the OpenAPI spec. Before building any component, run the api-spec build first:

```sh
cd fridge-cloud/api-spec && ./build.sh
```

This generates both Java interfaces (via Maven) and TypeScript types (`frontend-react/src/fridge-api/schema.d.ts` via `openapi-typescript`).

To build everything together, use the top-level build script:

```sh
cd fridge-cloud && ./build.sh --stageName=dev
```

This runs `api-spec/build.sh`, then backend, then frontend in order.
