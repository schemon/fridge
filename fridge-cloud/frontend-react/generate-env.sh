#!/bin/bash

# Read cognito config and generate .env.production for frontend build

# Function to display help text
show_help() {
    cat << EOF
Usage: $(basename "$0") --stageName=<stage_name>

Generates .env.production and .env.development from Cognito configuration for the specified stage.

EXAMPLES:
  ./$(basename "$0") --stageName=dev
  ./$(basename "$0") --stageName=prod
EOF
    exit 1
}

# Parse named parameters
STAGE_NAME=""
for arg in "$@"; do
    case $arg in
        --stageName=*) STAGE_NAME="${arg#*=}" ;;
        -h|--help)
            show_help
            ;;
        *)
            echo "Error: Unknown parameter: $arg"
            show_help
            ;;
    esac
done

# Validate required parameters
if [ -z "$STAGE_NAME" ]; then
    echo "Error: Missing required parameter --stageName"
    show_help
fi

CONFIG_FILE="../infra-aws/config/cognito-config-${STAGE_NAME}.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Cognito config file not found at $CONFIG_FILE"
    echo "Run 'cd infra-aws && ./deploy-auth-and-refresh-config.sh --profile=<profile> --stageName=$STAGE_NAME' first"
    exit 1
fi

# Parse JSON
ISSUER_URI=$(cat "$CONFIG_FILE" | grep -o '"issuerUri": *"[^"]*"' | sed 's/"issuerUri": *"\([^"]*\)"/\1/')
CLIENT_ID=$(cat "$CONFIG_FILE" | grep -o '"clientId": *"[^"]*"' | sed 's/"clientId": *"\([^"]*\)"/\1/')
COGNITO_DOMAIN=$(cat "$CONFIG_FILE" | grep -o '"cognitoDomain": *"[^"]*"' | sed 's/"cognitoDomain": *"\([^"]*\)"/\1/')

if [ -z "$ISSUER_URI" ] || [ -z "$CLIENT_ID" ] || [ -z "$COGNITO_DOMAIN" ]; then
    echo "Error: Failed to parse cognito config from $CONFIG_FILE"
    exit 1
fi


# Write .env.development
cat > .env.development <<EOF
VITE_API_BASE_URL=http://localhost:8080
VITE_AUTH_CLIENT_ID=$CLIENT_ID
VITE_AUTH_DOMAIN=$COGNITO_DOMAIN
VITE_ISSUER_URI=$ISSUER_URI
EOF

# Write .env.production
cat > .env.production <<EOF
VITE_API_BASE_URL=
VITE_AUTH_CLIENT_ID=$CLIENT_ID
VITE_AUTH_DOMAIN=$COGNITO_DOMAIN
VITE_ISSUER_URI=$ISSUER_URI
EOF

echo "✅ Generated .env files from cognito config for stage: $STAGE_NAME"
echo "  Client ID: $CLIENT_ID"
echo "  Cognito Domain: $COGNITO_DOMAIN"
