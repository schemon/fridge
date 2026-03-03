#!/bin/sh

# Function to display help text
show_help() {
    cat << EOF
Usage: $(basename "$0") --profile=<profile_name> --stageName=<stage_name>

Available profiles in ~/.aws/config

$(list_profiles)

EXAMPLES:
  ./$(basename "$0") --profile=my_profile --stageName=dev
EOF
    exit 1
}

# Function to list AWS profiles
list_profiles() {
    cat ~/.aws/config ~/.aws/credentials 2>/dev/null | \
    grep -E '^(\[profile |\[)' | \
    sed -E 's/^\[profile (.+)\]$/\1/; s/^\[(.+)\]$/\1/' | \
    sort -u
    exit 0
}

# Check if parameters are given
if [ $# -eq 0 ]; then
    echo "Error: Missing required parameter."
    show_help
fi

# Parse named parameters
for arg in "$@"; do
    case $arg in
        --profile=*) AWS_PROFILE="${arg#*=}" ;;
        --stageName=*) STAGE_NAME="${arg#*=}" ;;
        -h|--help)
            show_help
            ;;
        *)
            echo "Error: Unknown parameter: $1"
            show_help
            ;;
    esac
done

set -e
( cd infra-aws && npm install && npx cdk destroy --all --require-approval=never --profile=$AWS_PROFILE -c appName=fridge-cloud -c stageName=$STAGE_NAME )
