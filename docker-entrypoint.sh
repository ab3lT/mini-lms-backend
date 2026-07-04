#!/bin/sh
set -e

# Applies any pending migrations against DATABASE_URL before the app starts.
# `migrate deploy` is safe to run on every container start - it only applies
# migrations that haven't been applied yet and never prompts for input.
echo "Applying database migrations..."
npx prisma migrate deploy

echo "Starting Mini LMS backend..."
exec "$@"
