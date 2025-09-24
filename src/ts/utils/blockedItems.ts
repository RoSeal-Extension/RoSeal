import { allowedItemsData, blockedItemsData } from "../constants/misc";
import type { Agent } from "../helpers/requests/services/assets";
import type { MarketplaceItemType } from "../helpers/requests/services/marketplace";

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
					name.includes(keyword),
				)) ||
			(description !== undefined &&
				description !== null &&
				blockedItemsData.value?.experiences.descriptions.some((keyword) =>
					description.includes(keyword),
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
				blockedItemsData.value?.items.names.some((keyword) => name.includes(keyword))) ||
			(description !== undefined &&
				blockedItemsData.value?.items.descriptions.some((keyword) =>
					description.includes(keyword),
				)) ||
			(creatorType !== undefined &&
				creatorId !== undefined &&
				blockedItemsData.value?.creators.some(
					(creator) => creator.id === creatorId && creator.type === creatorType,
				)),
	);
}
