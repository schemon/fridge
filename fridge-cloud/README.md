# fridge-cloud

## Build all

```
./build.sh
```

## Run backend

```
( cd backend-java-serverless && ./run.sh )
```

## Run frontend
```
( cd frontend-react && ./run.sh)
```

## First time setup AWS

1. Create one or more databases at https://neon.tech/home
2. Fetch <connection-string> for each stage
3. Add connection string to stage prod and dev
```
aws ssm put-parameter \
    --name /prod-fridge-cloud/backend/datasource-connection-string \
    --type SecureString \
    --overwrite \
    --value "postgresql://neondb_owner:npg_qTGCmV3dSRk0@ep-weathered-poetry-agu22x2v-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```
```
aws ssm put-parameter \
    --name /dev-fridge-cloud/backend/datasource-connection-string \
    --type SecureString \
    --overwrite \
    --value "<connection-string>"
```
4. Verify connect to db
```
APP_STAGE_NAME=prod-fridge-cloud; URL=$(aws ssm get-parameter --with-decryption --name /$APP_STAGE_NAME/backend/datasource-connection-string | jq --raw-output '.Parameter.Value'); docker run -it postgres:17.2 psql $URL
```
```
APP_STAGE_NAME=dev-fridge-cloud; URL=$(aws ssm get-parameter --with-decryption --name /$APP_STAGE_NAME/backend/datasource-connection-string | jq --raw-output '.Parameter.Value'); docker run -it postgres:17.2 psql $URL
```

## Deploy
```
./deploy.sh
```

## Destroy

```
./destroy.sh
```

