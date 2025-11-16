import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { httpClient } from "../main.ts";
import type { SuccessResponse } from "./misc.ts";
import { getOrSetCache } from "../../cache.ts";

export type VoiceChatBan = {
	Seconds: number;
	Nanos: number;
};

export type GetUserVoiceSettingsResponse = {
	isVoiceEnabled: boolean;
	isUserOptIn: boolean;
	isUserEligible: boolean;
	isBanned: boolean;
	banReason: number;
	bannedUntil: VoiceChatBan | null;
	canVerifyAgeForVoice: boolean;
	isVerifiedForVoice: boolean;
	denialReason: number;
	isOptInDisabled: boolean;
	hasEverOpted: boolean;
	isAvatarVideoEnabled: boolean;
	isAvatarVideoOptIn: boolean;
	isAvatarVideoOptInDisabled: boolean;
	isAvatarVideoEligible: boolean;
	hasEverOptedAvatarVideo: boolean;
	userHasAvatarCameraAlwaysAvailable: boolean;
	canVerifyPhoneForVoice: boolean;
	seamlessVoiceStatus: number;
	allowVoiceDataUsage: boolean;
	seamlessVoiceVariant: "Control";
};

export type UserInformedOfBan = {
	informedOfBan: boolean;
};

export type UserVoiceOptInStatus = {
	isUserOptIn: boolean;
};

export async function getUserVoiceSettings(): Promise<GetUserVoiceSettingsResponse> {
	return getOrSetCache({
		key: ["user", "voice-settings"],
		fn: () =>
			httpClient
				.httpRequest<GetUserVoiceSettingsResponse>({
					url: getRobloxUrl("voice", "/v1/settings"),
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((res) => res.body),
	});
}

export async function getUserInformedOfBan() {
	return (
		await httpClient.httpRequest<UserInformedOfBan>({
			url: getRobloxUrl("voice", "/v1/moderation/informed-of-ban"),
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function setUserInformedOfBan(request: UserInformedOfBan) {
	return (
		await httpClient.httpRequest<SuccessResponse>({
			method: "POST",
			url: getRobloxUrl("voice", "/v1/moderation/informed-of-ban"),
			body: {
				type: "json",
				value: request,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function setUserVoiceOptInStatus(request: UserVoiceOptInStatus): Promise<void> {
	await httpClient.httpRequest({
		method: "POST",
		url: getRobloxUrl("voice", "/v1/settings/user-opt-in"),
		body: {
			type: "json",
			value: request,
		},
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function setUserAvatarChatOptInStatus(request: UserVoiceOptInStatus): Promise<void> {
	await httpClient.httpRequest({
		method: "POST",
		url: getRobloxUrl("voice", "/v1/settings/user-opt-in/avatarvideo"),
		body: {
			type: "json",
			value: request,
		},
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}
