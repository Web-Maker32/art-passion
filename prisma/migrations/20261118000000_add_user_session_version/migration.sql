-- Pre-launch: invalidate admin sessions on logout and password change.
-- Every existing user starts at version 0; the signed session cookie carries the
-- version it was issued with, and a mismatch forces a fresh sign-in.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;