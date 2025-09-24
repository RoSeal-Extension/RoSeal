export function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
	const r = 6371; // km
	const p = Math.PI / 180;

	const a =
		0.5 -
		Math.cos((lat2 - lat1) * p) / 2 +
		(Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p))) / 2;

	return 2 * r * Math.asin(Math.sqrt(a));
}
