#!/bin/bash

if [ "$DOCKER_ENV" != "true" ]; then
    source ./Docker/scripts/env_functions.sh
    export_env_vars
fi

DATABASE_PROVIDER=${DATABASE_PROVIDER:-postgresql}

if [[ "$DATABASE_PROVIDER" == "postgresql" || "$DATABASE_PROVIDER" == "mysql" || "$DATABASE_PROVIDER" == "psql_bouncer" ]]; then
    export DATABASE_URL="${DATABASE_URL:-$DATABASE_CONNECTION_URI}"
    export DATABASE_CONNECTION_URI="${DATABASE_CONNECTION_URI:-$DATABASE_URL}"
    echo "Deploying migrations for $DATABASE_PROVIDER"
    echo "Database URL: $DATABASE_URL"
    # rm -rf ./prisma/migrations
    # cp -r ./prisma/$DATABASE_PROVIDER-migrations ./prisma/migrations
    npm run db:deploy
    if [ $? -ne 0 ]; then
        echo "Migration failed"
        exit 1
    else
        echo "Migration succeeded"
    fi
    npm run db:generate
    if [ $? -ne 0 ]; then
        echo "Prisma generate failed"
        exit 1
    else
        echo "Prisma generate succeeded"
    fi
else
    echo "Error: Database provider $DATABASE_PROVIDER invalid."
    exit 1
fi
