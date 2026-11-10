# Operations

## Back up
Install PostgreSQL client tools (pg_dump/psql) compatible with the Neon server version and put their `bin` directory on PATH. On Windows, restart PowerShell after updating PATH.

The backup command does not read `.env.local`. Supply the direct, non-pooled Neon connection URL through the shell environment without echoing it or entering it in command history:

```powershell
$connection = Read-Host "Direct Neon connection URL" -AsSecureString
$env:DIRECT_URL = [System.Net.NetworkCredential]::new("", $connection).Password
pnpm db:backup
$env:DIRECT_URL = $null
$connection = $null
```

`DIRECT_URL` takes precedence over `DATABASE_URL`. Both are existing database connection settings; no new credential is required. The timestamped plain SQL dump is saved under `backups/`. Missing pg_dump, invalid configuration, dump failure, or timeout causes refusal with no connection details. Files ending `.partial.sql` are incomplete and must not be restored. No backup runs automatically.

Dumps contain customer data. Restrict folder permissions (including Windows ACLs), encrypt off-device copies, and never commit, upload publicly, or paste dump contents into support messages. Git ignores `backups/` and all `*.sql` files.

## Restore into a fresh Neon branch
1. In Neon Console, create an isolated recovery branch. For a full SQL restore, use an empty database on that branch so existing data is not overwritten. Never point the restore at the live database.
2. Retrieve that database's direct connection URL. Confirm the branch and database names in the console before proceeding.
3. Set `PGDATABASE` using the same secure prompt pattern as above, replacing `$env:DIRECT_URL` with `$env:PGDATABASE`.
4. Run `psql --no-password --set=ON_ERROR_STOP=on --single-transaction --file="backups/SELECTED-COMPLETE-DUMP.sql"`. The connection is inherited through `PGDATABASE`, never a command-line argument. Clear `$env:PGDATABASE = $null` afterward.
5. Verify table counts and sample orders privately on the recovery branch. Test with the application only after configuring it explicitly for that branch. Do not switch production automatically.

For point-in-time recovery, open **Neon Console → project → Branches → select branch → Restore**. Available history depends on the project's restore window/plan; confirm retention in the console. Prefer restoring to a recovery branch and verifying before any production change.

## Weekly owner checklist
- Run a backup and confirm a new complete `.sql` file exists.
- Copy that backup to encrypted off-device storage and check the previous copy still opens.
- Review the admin orders page for orders that have been pending payment for too long.
- Confirm the storefront, admin sign-in and image upload work.
- Check the hosting dashboard for failed deployments, server errors and the health route.
- Rotate any credential that might have been exposed, then redeploy.
