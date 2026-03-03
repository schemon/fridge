#!/bin/bash

npm install
npx openapi-typescript ../api-spec/src/main/resources/api.yaml -o ../frontend-react/src/fridge-api/schema.d.ts
mvn clean install
