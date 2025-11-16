import { getRobloxUrl } from "src/ts/utils/baseUrls";
import { httpClient } from "../main";
import { snakeizeObject } from "src/ts/utils/objects";

export type ExtraChatDataQuery = {
	includeCards?: boolean;
	includeUserData?: boolean;
	includeMessages?: boolean;
	checkForGroupUp?: boolean;
};

export type ListUserConversationsRequest = ExtraChatDataQuery & {
	cursor?: string;
};

export type UserConversationSource = "friends" | "channels";

export type UserConversationType = "one_to_one" | "group";

export type UserConversationParticipant = {
	id: number;
	name: string;
	displayName: string;
	isVerified: boolean;
};

export type UserConversationParticipantPendingStatus = "pending" | "not_pending" | "invalid";

export type UserConversationMessageType = "user" | "system";

export type UserConversationMessageModerationType = "moderated" | "not_moderated";

export type UserConversationPartyComponent = {
	type: "group_up";
	data: {
		conversationId: string;
		groupUpId: string;
		participantCount: number | null;
		participantUserIds: number[] | null;
		authUserIsParticipant: boolean;
		isAlive: boolean;
		createdByUserId: number;
	};
};

export type UserConversationMessageCard = {
	components: UserConversationPartyComponent[];
	altText: string;
};

export type UserConversationMessage = {
	id: string;
	content: string | null;
	senderUserId: number | null;
	createdAt: string;
	moderationType: UserConversationMessageModerationType;
	type: UserConversationMessageType;
	repliesTo: UserConversationMessage | null;
	isDeleted: boolean;
	isPreviewable: boolean;
	isBadgeable: boolean;
	cards?: unknown[];
};

export type UserOSAAcknowledgementStatus = "acknowledged" | "unacknowledged";

export type UserConversation = {
	source: UserConversationSource;
	id: null | string;
	type: UserConversationType;
	name: string | null;
	isDefaultName: boolean;
	createdBy: number;
	participantUserIds: number[];
	userData: Record<string, UserConversationParticipant>;
	messages: UserConversationMessage[];
	unreadMessageCount: number;
	updatedAt: string;
	createdAt: string;
	sortIndex?: number;
	previewMessage?: UserConversationMessage;
	hasGroupUp?: boolean;
	userPendingStatus?: UserConversationParticipantPendingStatus;
	participantPendingStatus?: UserConversationParticipantPendingStatus;
	osaAcknowledgementStatus?: UserOSAAcknowledgementStatus;
};

export type ListUserConversationsResponse = {
	conversations: UserConversation[];
	nextCursor: string | null;
	previousCursor: string | null;
};

export type ListUserConversationMessagesRequest = ExtraChatDataQuery & {
	conversationId: string;
	cursor: string;
};

export type ListUserConversationMessagesResponse = {
	messages: UserConversationMessage[];
	nextCursor: string | null;
	previousCursor: string | null;
};

export type GetChatMetadataResponse = {
	isChatEnabled: boolean;
	isChatEnabledByPrivacySetting: string;
	isGroupChatEnabledByPrivacySetting: string;
	isChatEnabledByGlobalRules: string;
	languageForPrivacySettingUnavailable: string;
	maxConversationTitleLength: number;
	numberOfMembersForPartyChrome: number;
	partyChromeDisplayTimeStampInterval: number;
	signalRDisconnectionResponseInMilliseconds: number;
	typingInChatFromSenderThrottleMs: number;
	typingInChatForReceiverExpirationMs: number;
	relativeValueToRecordUiPerformance: number;
	isChatDataFromLocalStorageEnabled: boolean;
	chatDataFromLocalStorageExpirationSeconds: number;
	isUsingCacheToLoadFriendsInfoEnabled: boolean;
	cachedDataFromLocalStorageExpirationMS: number;
	senderTypesForUnknownMessageTypeError: string[];
	isInvalidMessageTypeFallbackEnabled: boolean;
	isRespectingMessageTypeEnabled: boolean;
	validMessageTypesWhiteList: string[];
	shouldRespectConversationHasUnreadMessageToMarkAsRead: boolean;
	isAliasChatForClientSideEnabled: boolean;
	isPlayTogetherForGameCardsEnabled: boolean;
	isRoactChatEnabled: boolean;
	webChatEventSampleRate: number;
	isTrustedCommsWebEnabled: boolean;
	isWebChatSettingsMigrationEnabled: boolean;
	isWebChatRegionalityEnabled: boolean;
	isChatVisible: boolean;
	isChatUserMessagesEnabled: boolean;
};

export async function listUserConversations(request: ListUserConversationsRequest) {
	return (
		await httpClient.httpRequest<ListUserConversationsResponse>({
			url: getRobloxUrl("apis", "/platform-chat-api/v1/get-user-conversations"),
			search: snakeizeObject(request, { deep: true }),
			credentials: {
				type: "cookies",
				value: true,
			},
			camelizeResponse: true,
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function getChatMetadata() {
	return (
		await httpClient.httpRequest<GetChatMetadataResponse>({
			url: getRobloxUrl("apis", "/platform-chat-api/v1/metadata"),
			credentials: {
				type: "cookies",
				value: true,
			},
			camelizeResponse: true,
			errorHandling: "BEDEV2",
		})
	).body;
}
