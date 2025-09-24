export function getBadgeRarityLabelKey(percentageDecimal: number) {
	const percentage = percentageDecimal * 100;
	const defaultRarity = 100 as unknown as keyof typeof referenceRarityMap;
	const referenceRarityMap = {
		1: "Impossible",
		5: "Insane",
		10: "Extreme",
		20: "Hard",
		30: "Challenging",
		50: "Moderate",
		70: "Easy",
		80: "CakeWalk",
		100: "Freebie",
	} as const;

	for (const key in referenceRarityMap) {
		if (percentage <= Number.parseInt(key, 10)) {
			return referenceRarityMap[key as unknown as keyof typeof referenceRarityMap];
		}
	}

	return referenceRarityMap[defaultRarity];
}
