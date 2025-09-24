export function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export function randomFloat(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

export function randomArrItem<T>(arr: T[]) {
	return arr[randomInt(0, arr.length - 1)];
}

export type WeightedItem<T> = {
	value: T;
	weight: number;
};

export function getItemFromWeights<T>(items: WeightedItem<T>[]) {
	const total = items.reduce((sum, item) => sum + item.weight, 0);

	const random = Math.random() * total;
	let current = 0;
	for (const item of items) {
		current += item.weight;
		if (random < current) return item.value;
	}
}

export function getAdjustedWeightsForDisplay<T>(items: WeightedItem<T>[]) {
	const total = items.reduce((sum, item) => sum + item.weight, 0);

	return items.map((item) => ({
		...item,
		weight: (item.weight / total) * 100,
	}));
}

export async function randomSHA256(maxLength?: number) {
	const randomBytes = crypto.getRandomValues(new Uint8Array(32));
	const hashBuffer = await crypto.subtle.digest("SHA-256", randomBytes);
	const uint8View = new Uint8Array(hashBuffer);

	const length = maxLength ? Math.min(uint8View.byteLength, maxLength) : uint8View.byteLength;
	let str = "";
	for (let i = 0; i < length; i++) {
		str += uint8View[i].toString(16).padStart(2, "0");
	}

	return str;
}
