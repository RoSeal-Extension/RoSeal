import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { httpClient } from "../main.ts";
import type { MarketplaceItemType } from "./marketplace.ts";

export type ExperienceInviteStatus = "Valid" | "Expired" | "InviterNotInExperience";

export type ExperienceInviteData = {
	status: ExperienceInviteStatus;
	inviterId: number;
	placeId: number;
	instanceId: string;
	launchData?: string;
};

export type FriendInviteStatus =
	| "Valid"
	| "Expired"
	| "Consumed"
	| "SenderBlockedRecipient"
	| "Invalid";

export type FriendInviteData = {
	status: FriendInviteStatus;
	senderUserId: number;
	friendingToken: string;
};

export type PrivateServerLinkStatus = "Invalid" | "Valid" | "Expired";

export type PrivateServerLinkData = {
	status: PrivateServerLinkStatus;
	ownerUserId: number;
	universeId: number;
	privateServerId: number;
	linkCode: string;
	placeId: number;
};

export type ProfileShareStatus = "Valid" | "SenderBlockedRecipient" | "Invalid";
export type ProfileData = {
	status: ProfileShareStatus;
	userId: number;
};

export type ScreenshotInviteStatus = "Valid" | "Expired" | "InviterNotInExperience";

export type ScreenshotInviteData = {
	status: ScreenshotInviteStatus;
	inviterId: number;
	placeId: number;
	instanceId: string;
	launchData: string;
};

export type ExperienceDetailsStatus = "Valid";

export type ExperienceDetailsLinkData = {
	status: ExperienceDetailsStatus;
	universeId: number;
};

export type AvatarItemDetailsStatus = "Valid";

export type AvatarItemDetailsData = {
	itemId: string;
	itemType: MarketplaceItemType;
	status: AvatarItemDetailsStatus;
};

export type ContentPostStatus = "Valid" | "Invalid";

export type ContentPostData = {
	status: ContentPostStatus;
	postId: string | null;
	postCreatorId: number | null;
};

export type ResolveShareLinkResponse<T extends ShareLinkType> = {
	experienceInviteData: T extends "ExperienceInvite" ? ExperienceInviteData : null;
	friendInviteData: T extends "FriendInvite" ? FriendInviteData : null;
	notificationExperienceInviteData: T extends "NotificationExperienceInvite"
		? ExperienceInviteData
		: null;
	profileLinkResolutionResponseData: T extends "Profile" ? ProfileData : null;
	screenshotInviteData: T extends "ScreenshotInvite" ? ScreenshotInviteData : null;
	privateServerInviteData: T extends "Server" ? PrivateServerLinkData : null;
	experienceDetailsInviteData: T extends "ExperienceDetails" ? ExperienceDetailsLinkData : null;
	avatarItemDetailsData: T extends "AvatarItemDetails" ? AvatarItemDetailsData : null;
	contentPostData: T extends "ContentPost" ? ContentPostData : null;
	experienceAffiliateData: T extends "ExperienceAffiliate" ? ExperienceDetailsLinkData : null;
	experienceEventData: T extends "ExperienceEvent" ? unknown : null;
};

export type ShareLinkType =
	| "ExperienceInvite"
	| "FriendInvite"
	| "NotificationExperienceInvite"
	| "Profile"
	| "ScreenshotInvite"
	| "Server"
	| "ExperienceDetails"
	| "AvatarItemDetails"
	| "ContentPost"
	| "ExperienceAffiliate"
	| "ExperienceEvent";

export type ResolveShareLinkRequest<T extends ShareLinkType> = {
	linkType: T;
	linkId: string;
};

export type CreateShareLinkRequest<T extends ShareLinkType> = {
	linkType: T;
	data?: T extends "AvatarItemDetails"
		? {
				itemType: MarketplaceItemType | "Look";
				itemId: number;
			}
		: T extends "ScreenshotInvite"
			? {
					placeId: number;
					instanceId?: string;
					launchData?: string;
				}
			: T extends "ExperienceDetails"
				? {
						universeId: number;
					}
				: T extends "ContenPost"
					? {
							postId: string;
							postCreatorId: number;
						}
					: never;
};

export type CreateShareLinkResponse = {
	deepLinkUrl: string;
	linkId: string;
	shortUrl: string;
};

export type ShareLinkV2Type = "Experience" | "StudioEdit" | "StudioTeamTest";

export type CreateShareLinkV2Request<T extends ShareLinkV2Type> = {
	linkType: T;
	targetId: number;
	customData: T extends "Experience" ? Record<string, unknown> : void;
};

export type CreateShareLinkV2Response = {
	link: string;
};

export type ResolveShareLinkV2Request = {
	code: string;
};

export async function resolveShareLink<T extends ShareLinkType>(
	request: ResolveShareLinkRequest<T>,
): Promise<ResolveShareLinkResponse<T>> {
	return (
		await httpClient.httpRequest<ResolveShareLinkResponse<T>>({
			method: "POST",
			url: getRobloxUrl("apis", "/sharelinks/v1/resolve-link"),
			body: {
				type: "json",
				value: request,
			},
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function createShareLink<T extends ShareLinkType>({
	data,
	...request
}: CreateShareLinkRequest<T>): Promise<CreateShareLinkResponse> {
	return (
		await httpClient.httpRequest<CreateShareLinkResponse>({
			method: "POST",
			url: getRobloxUrl("apis", "/sharelinks/v1/create-link"),
			body: {
				type: "json",
				value: {
					...request,
					data: data && JSON.stringify(data),
				},
			},
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function resolveOrCreateShareLink<
	T extends ShareLinkType,
	U extends CreateShareLinkRequest<T>,
>({ data, ...request }: U) {
	return (
		await httpClient.httpRequest<CreateShareLinkResponse>({
			method: "POST",
			url: getRobloxUrl("apis", "/sharelinks/v1/get-or-create-link"),
			body: {
				type: "json",
				value: {
					...request,
					data: data && JSON.stringify(data),
				},
			},
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function createShareLinkV2<T extends ShareLinkV2Type>({
	customData,
	...request
}: CreateShareLinkV2Request<T>) {
	return (
		await httpClient.httpRequest<CreateShareLinkV2Response>({
			method: "POST",
			url: getRobloxUrl("apis", "/deeplinks/v2/static"),
			body: {
				type: "json",
				value: {
					...request,
					customData: customData && JSON.stringify(customData),
				},
			},
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function resolveShareLinkV2<T extends ShareLinkV2Type>(
	request: ResolveShareLinkV2Request,
) {
	return (
		await httpClient.httpRequest<CreateShareLinkV2Request<T>>({
			method: "POST",
			url: getRobloxUrl("apis", "/deeplinks/v2/resolve"),
			body: {
				type: "json",
				value: request,
			},
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function resolveOrCreateShareLinkV2<T extends ShareLinkV2Type>(
	request: ResolveShareLinkV2Request,
) {
	return (
		await httpClient.httpRequest<CreateShareLinkV2Request<T>>({
			method: "POST",
			url: getRobloxUrl("apis", "/deeplinks/v2/get-or-create-static"),
			body: {
				type: "json",
				value: request,
			},
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}
