import dotenv from "dotenv";
import readline from "node:readline";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";

dotenv.config({ path: [".env.local", ".env"] });

/**
 * Reads a line from the terminal WITHOUT echoing it, so the password never
 * appears on screen and is never written to any log.
 */
function questionHidden(query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    process.stdout.write(query);
    if (typeof stdin.setRawMode === "function") stdin.setRawMode(true);
    stdin.resume();

    let input = "";
    const onData = (chunk: Buffer) => {
      const char = chunk.toString("utf8");
      switch (char) {
        case "\n":
        case "\r":
        case "\u0004": // Ctrl+D
          if (typeof stdin.setRawMode === "function") stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write("\n");
          resolve(input);
          break;
        case "\u0003": // Ctrl+C
          if (typeof stdin.setRawMode === "function") stdin.setRawMode(false);
          process.stdout.write("\n");
          reject(new Error("Aborted."));
          break;
        case "\u007f": // Backspace
          input = input.slice(0, -1);
          break;
        default:
          input += char;
          break;
      }
    };
    stdin.on("data", onData);
  });
}

function questionVisible(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set before changing a password.");
  }

  const email = (await questionVisible("Admin email: ")).toLowerCase();
  if (!email) {
    throw new Error("An admin email is required.");
  }

  const password = await questionHidden("New password: ");
  const confirm = await questionHidden("Confirm new password: ");

  if (password.length < 8) {
    throw new Error("The password must be at least 8 characters long.");
  }
  if (password !== confirm) {
    throw new Error("The two passwords did not match. Nothing was changed.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "ADMIN") {
      throw new Error("No admin user exists with that email.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    console.info("Admin password updated successfully.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Failed to update the admin password.");
  process.exitCode = 1;
});
