import { describe, expect, it } from "vitest";
import { resolveDatabaseUrl } from "../src/lib/database-url";
import {
  isDatabaseFailure,
  matchDemoAccount,
  readDemoToken,
  sessionDestination,
  signDemoToken,
} from "../src/lib/demo-access";

describe("demo access", () => {
  it("matches the seeded demo passwords", () => {
    expect(matchDemoAccount("customer@venzorah.com", "VenzorahCustomer!23")?.roles).toEqual(["customer"]);
    expect(matchDemoAccount("vendor2@venzorah.com", "VenzorahVendor!23")?.vendorId).toBe("demo-vendor-kwame");
    expect(matchDemoAccount("venzorah.app@gmail.com", "Utomobong#@01")?.permissions).toContain(
      "admin.dashboard.view",
    );
    expect(matchDemoAccount("customer@venzorah.com", "wrong-password")).toBeNull();
    expect(matchDemoAccount("someone@example.com", "VenzorahCustomer!23")).toBeNull();
  });

  it("signs a token that only the matching account can read", () => {
    const token = signDemoToken("demo-customer", 7);
    expect(readDemoToken(token)?.email).toBe("customer@venzorah.com");
    expect(readDemoToken(`${token}x`)).toBeNull();
    expect(readDemoToken("demo.not-a-token")).toBeNull();
    const expired = signDemoToken("demo-admin", 1, Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(readDemoToken(expired)).toBeNull();
  });

  it("sends each portal to its dashboard", () => {
    expect(sessionDestination(["customer"], "buyer")).toBe("/account");
    expect(sessionDestination(["customer", "vendor"], "seller")).toBe("/vendor");
    expect(sessionDestination(["customer"], "seller")).toBe("/sell-on-venzorah");
    expect(sessionDestination(["admin", "customer", "vendor"], "buyer")).toBe("/admin");
    expect(sessionDestination(["admin"], "admin")).toBe("/admin");
  });

  it("treats a missing database as a failure and leaves other errors alone", () => {
    expect(isDatabaseFailure(new Error("A PostgreSQL URL is required. Set DATABASE_URL"))).toBe(true);
    expect(isDatabaseFailure(Object.assign(new Error("connect"), { code: "P1001" }))).toBe(true);
    expect(isDatabaseFailure(Object.assign(new Error("missing table"), { code: "P2021" }))).toBe(true);
    expect(isDatabaseFailure(new Error("Incorrect email or password."))).toBe(false);
    expect(isDatabaseFailure("offline")).toBe(false);
  });

  it("recognises the error Vercel throws when no database URL is configured", () => {
    const saved = {
      DATABASE_URL: process.env.DATABASE_URL,
      POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
      POSTGRES_URL: process.env.POSTGRES_URL,
      DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
      POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
      DIRECT_URL: process.env.DIRECT_URL,
      VERCEL: process.env.VERCEL,
    };
    for (const key of Object.keys(saved)) delete process.env[key];
    try {
      expect(() => resolveDatabaseUrl()).toThrow(/PostgreSQL URL is required/);
      try {
        resolveDatabaseUrl();
      } catch (error) {
        expect(isDatabaseFailure(error)).toBe(true);
      }
      process.env.VERCEL = "1";
      process.env.DATABASE_URL = "postgresql://venzorah:venzorah@localhost:5432/venzorah";
      expect(() => resolveDatabaseUrl()).toThrow(/localhost/);
      try {
        resolveDatabaseUrl();
      } catch (error) {
        expect(isDatabaseFailure(error)).toBe(true);
      }
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
