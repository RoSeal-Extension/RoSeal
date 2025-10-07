import { signal } from "@preact/signals";
import { allowedItemsData, blockedItemsData } from "../constants/misc";
import type { Agent } from "../helpers/requests/services/assets";
import type { MarketplaceItemType } from "../helpers/requests/services/marketplace";
import { error } from "./console";
import { REGEX_STRING_REGEX } from "./regex";

export const blockedItemsKeywordToRegEx = signal<Record<string, RegExp>>({});

function handleKeywords(keywords: string[]) {
	for (const keyword of keywords) {
		if (blockedItemsKeywordToRegEx.value[keyword]) continue;

		if (keyword.startsWith("/")) {
			const match = REGEX_STRING_REGEX.exec(keyword);
			if (match) {
				try {
					const regex = new RegExp(match[1], match[2]);

					blockedItemsKeywordToRegEx.value[keyword] = regex;
				} catch {
					error(`Could not compile RegEx for blocked items: ${keyword}`);
				}
			}
		}
	}
}

blockedItemsData.subscribe((blocked) => {
	blockedItemsKeywordToRegEx.value = {};

	if (blocked?.items.names) {
		handleKeywords(blocked.items.names);
	}

	if (blocked?.items.descriptions) {
		handleKeywords(blocked.items.descriptions);
	}

	if (blocked?.experiences.names) {
		handleKeywords(blocked.experiences.names);
	}

	if (blocked?.experiences.descriptions) {
		handleKeywords(blocked.experiences.descriptions);
	}
});

export function isExperienceBlocked(
	id?: number,
	creatorType?: Agent,
	creatorId?: number,
	_name?: string | null,
	_description?: string | null,
	blockedUniverseIds?: number[],
) {
	if (id !== undefined && blockedUniverseIds) return blockedUniverseIds.includes(id);
	const name = _name?.toLowerCase();
	const description = _description?.toLowerCase();

	if (
		(id !== undefined && allowedItemsData.value?.experiences.ids.includes(id)) ||
		(creatorType &&
			creatorId &&
			allowedItemsData.value?.creators.some(
				(creator) => creator.id === creatorId && creator.type === creatorType,
			))
	)
		return false;

	return Boolean(
		(id !== undefined && blockedItemsData.value?.experiences.ids.includes(id)) ||
			(name !== undefined &&
				name !== null &&
				blockedItemsData.value?.experiences.names.some((keyword) =>
					blockedItemsKeywordToRegEx.value[keyword]
						? blockedItemsKeywordToRegEx.value[keyword].test(name)
						: name.includes(keyword),
				)) ||
			(description !== undefined &&
				description !== null &&
				blockedItemsData.value?.experiences.descriptions.some((keyword) =>
					blockedItemsKeywordToRegEx.value[keyword]
						? blockedItemsKeywordToRegEx.value[keyword].test(description)
						: description.includes(keyword),
				)) ||
			(creatorType !== undefined &&
				creatorId !== undefined &&
				blockedItemsData.value?.creators.some(
					(creator) => creator.id === creatorId && creator.type === creatorType,
				)),
	);
}

export function isAvatarItemBlocked(
	itemId?: number,
	itemType?: MarketplaceItemType,
	creatorType?: Agent,
	creatorId?: number,
	_name?: string,
	_description?: string,
) {
	const name = _name?.toLowerCase();
	const description = _description?.toLowerCase();
	if (
		allowedItemsData.value?.items.items.find(
			(item) => item.id === itemId && item.type === itemType,
		) ||
		(creatorType &&
			creatorId &&
			allowedItemsData.value?.creators.some(
				(creator) => creator.id === creatorId && creator.type === creatorType,
			))
	)
		return false;

	return Boolean(
		blockedItemsData.value?.items.items.find(
			(item) => item.id === itemId && item.type === itemType,
		) ||
			(name !== undefined &&
				blockedItemsData.value?.items.names.some((keyword) =>
					blockedItemsKeywordToRegEx.value[keyword]
						? blockedItemsKeywordToRegEx.value[keyword].test(name)
						: name.includes(keyword),
				)) ||
			(description !== undefined &&
				blockedItemsData.value?.items.descriptions.some((keyword) =>
					blockedItemsKeywordToRegEx.value[keyword]
						? blockedItemsKeywordToRegEx.value[keyword].test(description)
						: description.includes(keyword),
				)) ||
			(creatorType !== undefined &&
				creatorId !== undefined &&
				blockedItemsData.value?.creators.some(
					(creator) => creator.id === creatorId && creator.type === creatorType,
				)),
	);
}
