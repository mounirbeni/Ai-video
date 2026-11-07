import { expect, it } from "vitest";
import { donationCents } from "../src/lib/paypal";

it("accepts donations only between $5 and $150", () => {
  expect(donationCents("3")).toBe(0);
  expect(donationCents("4.99")).toBe(0);
  expect(donationCents("5")).toBe(500);
  expect(donationCents("150")).toBe(15000);
  expect(donationCents("150,01")).toBe(0);
  expect(donationCents("1000")).toBe(0);
});
