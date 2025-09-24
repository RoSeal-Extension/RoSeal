export function bytesToHex(bytes: Uint8Array) {
	return [...bytes].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(str: string) {
	const uint8array = new Uint8Array(Math.ceil(str.length / 2));
	for (let i = 0; i < str.length; )
		// biome-ignore lint/suspicious/noAssignInExpressions: We know what we are doing
		uint8array[i / 2] = Number.parseInt(str.slice(i, (i += 2)), 16);

	return uint8array;
}
export async function bytesToBase64(buffer: Uint8Array) {
	// use a FileReader to generate a base64 data URI:
	const base64url = await new Promise<string>((r) => {
		const reader = new FileReader();
		reader.onload = () => r(reader.result as string);
		reader.readAsDataURL(new Blob([buffer]));
	});
	// remove the `data:...;base64,` part from the start
	return base64url.slice(base64url.indexOf(",") + 1);
}

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
// Use a lookup table to find the index.
const lookup = new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
	lookup[chars.charCodeAt(i)] = i;
}
export function base64ToBytes(base64: string) {
	let bufferLength = base64.length * 0.75;
	const len = base64.length;
	let p = 0;
	let encoded1: number;
	let encoded2: number;
	let encoded3: number;
	let encoded4: number;

	if (base64[base64.length - 1] === "=") {
		bufferLength--;
		if (base64[base64.length - 2] === "=") {
			bufferLength--;
		}
	}

	const bytes = new Uint8Array(bufferLength);

	for (let i = 0; i < len; i += 4) {
		encoded1 = lookup[base64.charCodeAt(i)];
		encoded2 = lookup[base64.charCodeAt(i + 1)];
		encoded3 = lookup[base64.charCodeAt(i + 2)];
		encoded4 = lookup[base64.charCodeAt(i + 3)];

		bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
		bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
		bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
	}

	return bytes;
}

export function base64ToString(base64: string) {
	const bytes = base64ToBytes(base64);
	const decoder = new TextDecoder();

	return decoder.decode(bytes);
}

export async function stringToBase64(str: string) {
	const encoder = new TextEncoder();
	const bytes = encoder.encode(str);

	return await bytesToBase64(bytes);
}
