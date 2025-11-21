import { describe, expect, test } from "bun:test";
import { isErrorLike, isLiteralErrorLike } from "../errors";

describe("errors utils", () => {
	describe("isLiteralErrorLike", () => {
		test("returns true for plain object with name and message strings", () => {
			const obj = { name: "MyError", message: "something went wrong" };
			expect(isLiteralErrorLike(obj)).toBe(true);
		});

		test("returns false for objects missing properties", () => {
			expect(isLiteralErrorLike({})).toBe(false);
			expect(isLiteralErrorLike({ name: "x" })).toBe(false);
			expect(isLiteralErrorLike({ message: "y" })).toBe(false);
		});

		test("returns false when name/message are not strings", () => {
			expect(isLiteralErrorLike({ name: 123, message: "ok" })).toBe(false);
			expect(isLiteralErrorLike({ name: "ok", message: {} })).toBe(false);
		});

		test("returns false for non-objects and null", () => {
			expect(isLiteralErrorLike(null)).toBe(false);
			expect(isLiteralErrorLike(undefined)).toBe(false);
			expect(isLiteralErrorLike(123)).toBe(false);
			expect(isLiteralErrorLike("error")).toBe(false);
			expect(isLiteralErrorLike([])).toBe(false);
		});
	});

	describe("isErrorLike", () => {
		test("returns true for real Error instances", () => {
			expect(isErrorLike(new Error("boom"))).toBe(true);
			class CustomError extends Error {}
			expect(isErrorLike(new CustomError("oops"))).toBe(true);
		});

		test("returns true for literal error-like objects", () => {
			const obj = { name: "E", message: "m" };
			expect(isErrorLike(obj)).toBe(true);
		});

		test("returns false for non-error-like values", () => {
			expect(isErrorLike(null)).toBe(false);
			expect(isErrorLike({})).toBe(false);
			expect(isErrorLike({ name: "n" })).toBe(false);
			expect(isErrorLike("err")).toBe(false);
			expect(isErrorLike(42)).toBe(false);
		});
	});
});
