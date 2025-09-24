import type { AvatarItemRestriction } from "src/ts/helpers/requests/services/marketplace";

export function getItemRestrictionsClassName(itemRestrictions?: AvatarItemRestriction[] | null) {
	if (!itemRestrictions) return;

	if (itemRestrictions.includes("Limited")) {
		return "icon-limited-label";
	}

	if (itemRestrictions.includes("Collectible") || itemRestrictions.includes("LimitedUnique")) {
		return "icon-limited-unique-label";
	}

	if (itemRestrictions.includes("Live")) {
		return "icon-default-dynamichead";
	}
}
