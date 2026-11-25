import { describe, expect, it } from "vitest";
import { normalizePakistaniPhone } from "@/lib/phone";

describe("normalizePakistaniPhone", () => {
  it.each([
    ["0300-1234567", "+923001234567"],
    ["03001234567", "+923001234567"],
    ["+92 300 1234567", "+923001234567"],
    ["+92 (300) 123-4567", "+923001234567"],
    ["92 300 1234567", "+923001234567"],
    ["0092 300 1234567", "+923001234567"],
    ["00923001234567", "+923001234567"],
    ["0092-300-1234567", "+923001234567"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizePakistaniPhone(input)).toBe(expected);
  });

  it.each([
    "",
    "0300123456",
    "02001234567",
    "abc03001234567",
    "+92 300 123 456",
    "0092 300 123456",
    "0044 300 1234567",
  ])("rejects %s", (input) => {
    expect(normalizePakistaniPhone(input)).toBeNull();
  });
});
