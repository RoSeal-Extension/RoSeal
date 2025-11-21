export interface ErrorLike {
	name: string;
	message: string;
}

export function isLiteralErrorLike(value: unknown): value is ErrorLike {
	if (typeof value !== "object" || value === null) return false;

	return (
		"name" in value &&
		typeof value.name === "string" &&
		"message" in value &&
		typeof value.message === "string"
	);
}

export function isErrorLike(value: unknown): value is ErrorLike {
	return value instanceof Error || isLiteralErrorLike(value);
}
