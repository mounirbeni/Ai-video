import { expect, it } from "vitest";
import { getAccountIdentity } from "../src/lib/account-identity";

it("recognizes the designated developer only after verifying the exact email", () => {
  const user = { role: "USER", email: "mobanunir@gmail.com", emailVerified: null as Date | null };
  expect(getAccountIdentity(user)).toBeNull();
  expect(getAccountIdentity({ ...user, emailVerified: new Date() })).toBe("developer");
  expect(getAccountIdentity({ ...user, email: " MOBANUNIR@GMAIL.COM ", emailVerified: new Date() })).toBe("developer");
  for (const email of ["mobanunir+fake@gmail.com", "mobanunir@gmail.com.evil.test", "other@example.com"]) {
    expect(getAccountIdentity({ ...user, email, emailVerified: new Date() })).toBeNull();
  }
});

it("derives admin identity from the existing role and leaves ordinary accounts unchanged", () => {
  expect(getAccountIdentity(null)).toBeNull();
  expect(getAccountIdentity({ role: "ADMIN", email: "admin@example.com", emailVerified: null })).toBe("admin");
  expect(getAccountIdentity({ role: "USER", email: "viewer@example.com", emailVerified: new Date() })).toBeNull();
  // An existing admin who is also the developer keeps their developer identity.
  expect(getAccountIdentity({ role: "ADMIN", email: "mobanunir@gmail.com", emailVerified: new Date() })).toBe("developer");
});
