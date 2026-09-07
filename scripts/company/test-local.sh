#!/usr/bin/env bash
set -euo pipefail
# Existing isolated PostgreSQL only. Never creates or modifies a hosted database.
: "${PGHOST:=127.0.0.1}" "${PGPORT:=55432}" "${PGUSER:=$(id -un)}"
export PGHOST PGPORT PGUSER
case "$PGHOST" in localhost|127.0.0.1) ;; *) echo 'Local PostgreSQL required' >&2; exit 1;; esac
company_test_database="loopsignal_test_$(date +%s)_$$"
createdb "$company_test_database"
psql -v ON_ERROR_STOP=1 -d "$company_test_database" -f scripts/company/native-bootstrap.sql -f supabase/migrations/202609070001_company.sql >/dev/null
export COMPANY_TEST_ADMIN_URL="postgres://$PGUSER@$PGHOST:$PGPORT/$company_test_database"
export COMPANY_DATABASE_URL="$COMPANY_TEST_ADMIN_URL"
npx vitest run lib/hosted/__tests__ --reporter=dot
# Kept intentionally for inspection. No automatic destructive cleanup.
echo "Synthetic test database retained: $company_test_database"
