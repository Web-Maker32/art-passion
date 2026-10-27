import { describe, expect, it } from "vitest";
import { normalizePakistaniPhone } from "@/lib/phone";

describe("normalizePakistaniPhone", () => {
  it.each([
    ["0300-1234567", "+923001234567"],
    ["03001234567", "+923001234567"],
    ["+92 300 1234567", "+923001234567"],
    ["+92 (300) 123-4567", "+923001234567"],
    ["92 300 1234567", "+923001234567"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizePakistaniPhone(input)).toBe(expected);
  });

  it.each([
    "",
    "0300123456",
    "02001234567",
    "abc03001234567",
    "+92 300 123 456",
  ])("rejects %s", (input) => {
    expect(normalizePakistaniPhone(input)).toBeNull();
  });
});
