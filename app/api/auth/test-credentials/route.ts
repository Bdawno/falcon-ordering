import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { users } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const {
    SEED_ADMIN_EMAIL: adminEmail,
    SEED_ADMIN_PASSWORD: adminPassword,
    SEED_EMPLOYEE_EMAIL: employeeEmail,
    SEED_EMPLOYEE_PASSWORD: employeePassword,
  } = process.env;

  if (adminEmail && adminPassword && employeeEmail && employeePassword) {
    return NextResponse.json(
      {
        admin: { email: adminEmail, password: adminPassword },
        employee: { email: employeeEmail, password: employeePassword },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const legacyAccounts = [
    {
      key: "admin",
      email: "admin@falconnorthwest.com",
      password: "admin123",
      role: "admin",
    },
    {
      key: "employee",
      email: "employee@falconnorthwest.com",
      password: "employee123",
      role: "employee",
    },
  ] as const;
  const credentials: Partial<
    Record<(typeof legacyAccounts)[number]["key"], { email: string; password: string }>
  > = {};

  for (const account of legacyAccounts) {
    const user = users.findByEmail(account.email) as
      | { password: string; role: string }
      | undefined;
    if (user?.role === account.role && (await bcrypt.compare(account.password, user.password))) {
      credentials[account.key] = {
        email: account.email,
        password: account.password,
      };
    }
  }

  if (!credentials.admin || !credentials.employee) {
    return NextResponse.json(
      { error: "Development test accounts are not configured" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    credentials,
    { headers: { "Cache-Control": "no-store" } }
  );
}
