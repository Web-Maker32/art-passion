import { mkdir, rename } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { z } from "zod";

async function main() {
  const available = spawnSync("pg_dump", ["--version"], { stdio: "ignore", windowsHide: true, timeout: 10_000 });
  if (available.error || available.status !== 0) throw new Error("pg_dump is missing or unavailable. Install PostgreSQL client tools and add their bin folder to PATH.");
  // Only the owner's exported environment is used. This command does not read .env.local.
  const connection = z.string().max(8192).url().refine((value) => /^postgres(?:ql)?:\/\//.test(value))
    .safeParse(process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim());
  if (!connection.success) throw new Error("Set DIRECT_URL (preferred) or DATABASE_URL in your shell before running the backup.");
  const directory = fileURLToPath(new URL("../backups/", import.meta.url));
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const name = `art-passion-${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`;
  const partial = `${directory}${name}.partial.sql`;
  const destination = `${directory}${name}.sql`;
  const dump = spawnSync("pg_dump", ["--format=plain", "--no-password", "--no-owner", "--no-acl", `--file=${partial}`], {
    env: { ...process.env, PGDATABASE: connection.data, PGCONNECT_TIMEOUT: "10" },
    stdio: "ignore", windowsHide: true, timeout: 15 * 60_000,
  });
  if (dump.error || dump.status !== 0) throw new Error("Backup failed. Check connectivity, permissions and pg_dump version. Any .partial.sql file is incomplete; do not restore it.");
  await rename(partial, destination);
  console.info(`Backup saved to backups/${name}.sql. Store a protected off-device copy.`);
}

main().catch((error: unknown) => {
  // Only errors constructed by this script are printable; OS errors can contain paths.
  const known = error instanceof Error && ["pg_dump is missing", "Set DIRECT_URL", "Backup failed"].some((prefix) => error.message.startsWith(prefix));
  console.error(known ? (error as Error).message : "Backup could not be completed. Check local filesystem permissions.");
  process.exitCode = 1;
});
