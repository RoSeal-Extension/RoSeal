import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "assert" };
import type { ThumbnailState } from "./thumbnails";
import { httpClient } from "../main";

export type IntlImage = {
	imageId: string | null;
	imageUrl: string;
	state: ThumbnailState;
	languageCode: string;
};

export type IntlNameDescriptionUpdateType = "Invalid" | "Name" | "Description";

export type IntlNameDescription = {
	name: string;
	description: string;
	updateType: IntlNameDescriptionUpdateType | null;
	languageCode: string;
};

export type DataWithIntlImages = {
	data: IntlImage[];
};

export type DataWithIntlNameDescriptions = {
	data: IntlNameDescription[];
};

export type IntlMediaAsset = {
	mediaAssetId: string;
	mediaAssetAltText: string;
	state: ThumbnailState | "Approved";
	mediaAssetUrl: string;
};

export type IntlThumbnailSet = {
	languageCode: string;
	mediaAssets: IntlMediaAsset[];
};

export type ListUniverseIntlThumbnailsResponse = {
	data: IntlThumbnailSet[];
};

export type ListBadgeIntlIconsRequest = {
	badgeId: number;
};

export type ListDeveloperProductIntlIconsRequest = {
	developerProductId: number;
};

export type ListPassIntlIconsRequest = {
	passId: number;
};

export type ListUniverseIntlIconsRequest = {
	universeId: number;
};

export async function listBadgeIntlIcons({ badgeId }: ListBadgeIntlIconsRequest) {
	return (
		await httpClient.httpRequest<DataWithIntlImages>({
			url: `${getRobloxUrl("gameinternationalization")}/v1/badges/${badgeId}/icons`,
			includeCredentials: true,
		})
	).body;
}

export async function listBadgeIntlNameDescription({ badgeId }: ListBadgeIntlIconsRequest) {
	return (
		await httpClient.httpRequest<DataWithIntlNameDescriptions>({
			url: `${getRobloxUrl("gameinternationalization")}/v1/badges/${badgeId}/name-description`,
			includeCredentials: true,
		})
	).body;
}

export async function listDeveloperProductIntlIcons({
	developerProductId,
}: ListDeveloperProductIntlIconsRequest) {
	return (
		await httpClient.httpRequest<DataWithIntlImages>({
			url: `${getRobloxUrl("gameinternationalization")}/v1/developer-products/${developerProductId}/icons`,
			includeCredentials: true,
		})
	).body;
}

export async function listDeveloperProductIntlNameDescription({
	developerProductId,
}: ListDeveloperProductIntlIconsRequest) {
	return (
		await httpClient.httpRequest<DataWithIntlNameDescriptions>({
			url: `${getRobloxUrl("gameinternationalization")}/v1/developer-products/${developerProductId}/name-description`,
			includeCredentials: true,
		})
	).body;
}

export async function listPassIntlIcons({ passId }: ListPassIntlIconsRequest) {
	return (
		await httpClient.httpRequest<DataWithIntlImages>({
			url: `${getRobloxUrl("gameinternationalization")}/v1/game-passes/${passId}/icons`,
			includeCredentials: true,
		})
	).body;
}

export async function listPassIntlNameDescription({ passId }: ListPassIntlIconsRequest) {
	return (
		await httpClient.httpRequest<DataWithIntlNameDescriptions>({
			url: `${getRobloxUrl("gameinternationalization")}/v1/game-passes/${passId}/name-description`,
			includeCredentials: true,
		})
	).body;
}

export async function listUniverseIntlIcons({ universeId }: ListUniverseIntlIconsRequest) {
	return (
		await httpClient.httpRequest<DataWithIntlImages>({
			url: `${getRobloxUrl("gameinternationalization")}/v1/game-icon/games/${universeId}`,
			includeCredentials: true,
		})
	).body;
}

export async function listUniverseIntlThumbnails({ universeId }: ListUniverseIntlIconsRequest) {
	return (
		await httpClient.httpRequest<ListUniverseIntlThumbnailsResponse>({
			url: `${getRobloxUrl("gameinternationalization")}/v1/game-thumbnails/games/${universeId}/images`,
			includeCredentials: true,
		})
	).body;
}

export async function listUniverseIntlNameDescription({
	universeId,
}: ListUniverseIntlIconsRequest) {
	return (
		await httpClient.httpRequest<DataWithIntlNameDescriptions>({
			url: `${getRobloxUrl("gameinternationalization")}/v1/name-description/games/${universeId}`,
			includeCredentials: true,
		})
	).body;
}
