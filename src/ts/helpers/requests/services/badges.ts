import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { getOrSetCache, getOrSetCaches } from "../../cache.ts";
import { httpClient } from "../main.ts";

export type GetBadgeByIdRequest = {
	badgeId: number;
	overrideCache?: boolean;
};

export type BadgeStatistics = {
	pastDayAwardedCount: number;
	awardedCount: number;
	winRatePercentage: number;
};

export type BadgeUniverse = {
	id: number;
	name: string;
	rootPlaceId: number;
};

export type BadgeDetails = {
	id: number;
	name: string;
	description: string | null;
	displayName: string;
	displayDescription: string | null;
	enabled: boolean;
	iconImageId: number;
	displayIconImageId: number;
	created: string;
	updated: string;
	statistics: BadgeStatistics;
	awardingUniverse: BadgeUniverse;
};

export type SortOrder = "Asc" | "Desc";

export type BadgesSortBy = "Rank" | "DateCreated";

export type ListUniverseBadgesRequest = {
	universeId: number;
	sortBy?: BadgesSortBy;
	limit?: number;
	sortOrder?: SortOrder;
	cursor?: string;
};

export type ListUniverseBadgesResponse = {
	previousPageCursor?: string;
	nextPageCursor?: string;
	data: BadgeDetails[];
};

export type BadgeAwardedDate = {
	badgeId: number;
	awardedDate: string;
};

export type MultigetBadgesAwardedDatesRequest = {
	userId: number;
	badgeIds: number[];
	overrideCache?: boolean;
};

export type MultigetBadgesAwardedDatesResponse = {
	data: BadgeAwardedDate[];
};

export type ListUserBadgesRequest = {
	userId: number;
	limit?: number;
	sortOrder?: SortOrder;
	cursor?: string;
};

export type DeleteBadgeFromInventoryRequest = {
	badgeId: number;
};

export function getBadgeById({ badgeId, overrideCache }: GetBadgeByIdRequest) {
	return getOrSetCache({
		key: ["badges", badgeId, "details"],
		fn: async () =>
			(
				await httpClient.httpRequest<BadgeDetails>({
					url: `${getRobloxUrl("badges")}/v1/badges/${badgeId}`,
					includeCredentials: true,
				})
			).body,
		overrideCache,
	});
}

export async function listUserBadges({ userId, ...request }: ListUserBadgesRequest) {
	return (
		await httpClient.httpRequest<ListUniverseBadgesResponse>({
			url: `${getRobloxUrl("badges")}/v1/users/${userId}/badges`,
			search: request,
			includeCredentials: true,
		})
	).body;
}

export async function listUniverseBadges({ universeId, ...request }: ListUniverseBadgesRequest) {
	return (
		await httpClient.httpRequest<ListUniverseBadgesResponse>({
			url: `${getRobloxUrl("badges")}/v1/universes/${universeId}/badges`,
			search: request,
			includeCredentials: true,
		})
	).body;
}

export async function multigetBadgesAwardedDates({
	userId,
	badgeIds,
	overrideCache,
}: MultigetBadgesAwardedDatesRequest) {
	return getOrSetCaches({
		baseKey: ["badges", "awarded-dates", userId],
		keys: badgeIds.map((badgeId) => ({
			id: badgeId,
		})),
		fn: (badgeIds) =>
			httpClient
				.httpRequest<MultigetBadgesAwardedDatesResponse>({
					url: `${getRobloxUrl("badges")}/v1/users/${userId}/badges/awarded-dates`,
					search: {
						badgeIds: badgeIds.map((id) => id.id),
					},
				})
				.then((data) => {
					const items: Record<number, BadgeAwardedDate> = {};
					for (const item of data.body.data) {
						items[item.badgeId] = item;
					}

					return items;
				}),
		batchLimit: 100,
		overrideCache,
	});
}

export async function deleteBadgeFromInventory({ badgeId }: DeleteBadgeFromInventoryRequest) {
	await httpClient.httpRequest<void>({
		url: `${getRobloxUrl("badges")}/v1/user/badges/${badgeId}`,
		method: "DELETE",
		expect: "none",
		includeCredentials: true,
	});
}
