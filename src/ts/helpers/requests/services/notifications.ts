import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { httpClient } from "../main";
import type { FriendRequestOriginType } from "./users";

export type BaseNotification = {
	SequenceNumber: number;
	RealtimeMessageIdentifier: string;
	ShouldSendToEventStream: boolean;
};

export type RealtimeNotificationsSubscriptionStatusInformation = {
	MillisecondsBeforeHandlingReconnect: number;
	SequenceNumber: number;
	NamespaceSequenceNumbers: Record<string, number>;
};

export type ActorType = "User" | "System";

export type ChatNotificationType =
	| "NewMessage"
	| "NewMessageBySelf"
	| "NewConversation"
	| "AddedToConversation"
	| "RemovedFromConversation"
	| "ParticipantAdded"
	| "ParticipantLeft"
	| "ConversationTitleModerated"
	| "ConversationTitleChanged"
	| "ParticipantTyping"
	| "ConversationUniverseChanged";

export type RealtimeNotificationsChatNotificationsInformation = BaseNotification & {
	ConversationId: number;
	ActorTargetId?: number;
	ActorType?: ActorType;
	Type: ChatNotificationType;
};

export type RealtimeNotificationsUserProfileNotificationsInformation = BaseNotification & {
	Type: "DisplayName";
	VieweeUserId: number;
};

export type NotificationStreamNotificationType =
	| "NewNotification"
	| "NotificationsRead"
	| "NotificationMarkedInteracted"
	| "NotificationRevoked";

export type RealtimeNotificationsNotificationStreamInformation = BaseNotification & {
	Type: NotificationStreamNotificationType;
	NotificationId?: string;
};

export type FriendshipNotificationArgs = {
	UserId1: number;
	UserId2: number;
	UserId1IsActor: boolean;
	SourceType: FriendRequestOriginType;
};

export type FriendshipNotificationType =
	| "FriendshipDestroyed"
	| "FriendshipCreated"
	| "FriendshipDeclined"
	| "FriendshipRequested";

export type RealtimeNotificationsFriendshipNotificationInformation = BaseNotification & {
	Type: FriendshipNotificationType;
	EventArgs: FriendshipNotificationArgs;
};

export type UserTagChangeNotificationType = "UserTagUpdate";

export type RealtimeNotificationsUserTagChangeNotificationInformation = BaseNotification & {
	UserId: number;
	Type: UserTagChangeNotificationType;
	NewAlias: string;
};

export type ChatPrivacySettingNotificationType = "ChatEnabled" | "ChatDisabled";

export type RealtimeNotificationsChatPrivacySettingNotificationInformation = BaseNotification & {
	Type: ChatPrivacySettingNotificationType;
};

export type PresenceNotificationType = "PresenceChanged";

export type RealtimeNotificationsPresenceNotificationInformation = BaseNotification & {
	UserId: number;
	Type: PresenceNotificationType;
};

export type AuthenticationNotificationType = "SignOut";

export type RealtimeNotificationsAuthenticationNotificationInformation = BaseNotification & {
	UserId: number;
	Type: AuthenticationNotificationType;
};

export type UserThemeTypeChangeNotificationType = "ThemeUpdate";

export type RealtimeNotificationsUserThemeTypeChangeNotificationInformation = BaseNotification & {
	Type: UserThemeTypeChangeNotificationType;
};

export type AvatarOwnershipNotificationType = "Grant" | "Update" | "Revoke";

export type RealtimeNotificationsAvatarOutfitOwnershipNotificationInformation = BaseNotification & {
	UserOutfitId: number;
	Type: AvatarOwnershipNotificationType;
};

export type RealtimeNotificationsAvatarAssetOwnershipNotificationInformation = BaseNotification & {
	AssetId: number;
	AssetTypeId: number;
	Type: AvatarOwnershipNotificationType;
};

export type GameCloseNotificationType = "Close";

export type RealtimeNotificationsGameCloseNotificationInformation = BaseNotification & {
	Type: GameCloseNotificationType;
};

export type GameFavoriteNotificationType = "Favorite" | "Unfavorite";

export type RealtimeNotificationsGameFavoriteNotificationInformation = BaseNotification & {
	Type: GameFavoriteNotificationType;
};

export type DisplayNameNotificationType = "Update";

export type RealtimeNotificationsDisplayNameNotificationInformation = BaseNotification & {
	Type: DisplayNameNotificationType;
	UserId: number;
	NewDisplayName: string;
};

export type MessageNotificationTyoe =
	| "Created"
	| "MarkAsRead"
	| "Archived"
	| "UnArchived"
	| "MarkAsUnRead";

export type RealtimeNotificationsMessageNotificationInformation = BaseNotification & {
	Type: MessageNotificationTyoe;
	MessageId: number;
};

export type GroupWallNotificationType = "TopicUpdate";

export type GroupWallNotificationPayloadType = "NewPost";

export type GroupWallNotificationPayload = {
	Type: GroupWallNotificationPayloadType;
	GroupId: number;
	PostId: number;
};

export type RealtimeNotificationsGroupWallNotificationInformation = BaseNotification & {
	Type: GroupWallNotificationType;
	Topic: string;
	Payload: GroupWallNotificationPayload;
	SubscribeReceipt: string | null;
};

export type AdhocNotificationType = "SetupConnection";

export type RealtimeNotificationsAdhocNotificationInformation = BaseNotification & {
	Type: AdhocNotificationType;
	Topic: string | null;
	Payload: unknown | null;
	SubscribeReceipt: string | null;
};

export type PartyType = "General" | "PlayTogether" | "Xbox";

export type PartyNotificationType =
	| "PartyUserJoined"
	| "PartyUserLeft"
	| "ILeftParty"
	| "InvitedToParty"
	| "IJoinedParty"
	| "PartyDeleted"
	| "PartyLeftGame"
	| "PartyJoinedGame";

export type RealtimeNotificationsPartyNotificationInformation = BaseNotification & {
	PartyId: string;
	PartyType: PartyType;
	Type: PartyNotificationType;
};

export type RealtimeSubscriptionStatus = "Subscribed" | "ConnectionLost" | "Reconnected";

export type RealtimeNotificationsSubscriptionStatus = [
	"UserNotificationHub",
	"subscriptionStatus",
	[RealtimeSubscriptionStatus, string],
	never,
];

export type RealtimeNotificationsNotification = [
	"UserNotificationHub",
	"notification",
	[string, string, number],
	never,
];

export type RealTimeNotificationssVoiceNotificationsInformationType =
	| "CreatedChannelCall"
	| "JoinedVoiceCall"
	| "PublishingInitiated"
	| "PublishingCompleted"
	| "SubscriptionsInitiated"
	| "SubscriptionsCompleted"
	| "ParticipantModeratedFromVoice"
	| "ParticipantRemovedFromCall"
	| "ParticipantsJoined"
	| "PublishingCompleted"
	| "SubscriptionsInitiated"
	| "ParticipantsLeft"
	| "ParticipantActive"
	| "ParticipantMuted"
	| "SubscriptionsAddCompleted"
	| "SubscriptionsRemoveCompleted";

export type RealTimeNotificationssVoiceNotificationsInformation = BaseNotification & {
	sdpAnswer?: string;
	sdpOffer?: string;
	mutedUsers?: number[];
	isMuted?: boolean;
	subscribedUserId?: number;
	failure?: unknown | null;
	feedReferenceId?: number;
	sessionId: string;
	type: RealTimeNotificationssVoiceNotificationsInformationType;
	channelId: string;
};

export type RealtimeNotificationsMachineLearningChatInformation = BaseNotification & {
	requestId: string;
	isFinal: number;
	responseType: "stream_shunk" | "message_chunk";
	streamId: string;
	streamSequenceNumber: number;
	content: string;
};

export type CallNotificationType =
	| "NewCall"
	| "CallAccepted"
	| "CallMissed"
	| "CallDeclined"
	| "CallFinished";

export type RealtimeNotificationsCallNotificationInformation = BaseNotification & {
	Type: CallNotificationType;
	CallId: string;
	CallerId: number;
	CalleeId: number;
	PlaceId: number;
	InstanceId: string;
	ReservedServerAccesCode: string;
	CreatedUtc: number;
	LocalizedUniverseName: string;
	IsCalleeMicEnabled: boolean;
};

export type ToastDesktopNotificationInformationContentStateVisualItemThumbnail = {
	visualItemType: "Thumbnail";
	id: string;
	idType: string;
};

export type ToastDesktopNotificationInformationStyledElement = {
	styledElementType: "highlight" | string;
	offset: string;
	length: number;
};

export type ToastDesktopNotificationInformationLabel = {
	text: string;
	styledElements: ToastDesktopNotificationInformationStyledElement[];
};

export type ToastDesktopNotificationInformationContentStateVisualItemAction = {
	actionType: string;
	path: string;
	messageId?: string;
	parameters?: string;
	nextState: string;
	fallbackState: string;
};

export type ToastDesktopNotificationInformationContentStateVisualItemTextBody = {
	label: ToastDesktopNotificationInformationLabel;
	title: ToastDesktopNotificationInformationLabel;
	actions: ToastDesktopNotificationInformationContentStateVisualItemAction[];
};

export type ToastDesktopNotificationInformationContentStateVisualItemButton = {
	visualItemType: "Button";
	visualItemName: string;
	label: ToastDesktopNotificationInformationLabel;
	actions: ToastDesktopNotificationInformationContentStateVisualItemAction[];
	buttonStyle: string;
	eventName: string;
};

export type ToastDesktopNotificationInformationContentStateVisualItem = {
	thumbnail?: ToastDesktopNotificationInformationContentStateVisualItemThumbnail;
	button?: ToastDesktopNotificationInformationContentStateVisualItemButton;
	textBody?: ToastDesktopNotificationInformationContentStateVisualItemTextBody;
};

export type ToastDesktopNotificationInformationContentState = {
	name: string;
	layoutKey: string;
	timeOnScreemMs: number;
	visualItems: ToastDesktopNotificationInformationContentStateVisualItem[];
};

export type ToastDesktopNotificationInformationContent = {
	currentState: string;
	notificationType: string;
	id: string;
	minVersion: string;
	states: Record<string, ToastDesktopNotificationInformationContentState>;
	priority: "High" | string;
	actions: Record<string, ToastDesktopNotificationInformationContentStateVisualItemAction[]>;
	clientEventsPayload: Record<string, unknown>;
};
export type ToastDesktopNotificationInformation = BaseNotification & {
	payloadType: "Native";
	content: ToastDesktopNotificationInformationContent;
};

export type AssetUpdateNotificationInformation = {
	AssetId: number;
	VersionNumber: number;
	AssetVersionId: number;
	isPublished: boolean;
};

export type AvatarAutoSetupCompleteInformation = {
	job_id: string;
	texture_asset_id: number;
	modal_asset_id: string;
	job_status: string;
	error_status: number;
	message: string;
	model_url: string | null;
};

export type RealtimeNotificationsCommunicationChannelsInformation = BaseNotification & {
	Type:
		| "ChannelMetadataUpdated"
		| "MessageCreated"
		| "ChannelCreated"
		| "SystemMessageCreated"
		| "ParticipantsInvited"
		| "ParticipantsAdded"
		| "RemovedFromChannel"
		| "ChannelDeleted"
		| "ChannelUpdated"
		| "ChannelMarkedRead"
		| "ParticipantsRemoved"
		| "ChannelUnarchived"
		| "ChannelArchived"
		| "ParticipantTyping";
	Actor: // Only a string on ParticipantsInvited
		| {
				Type: "User" | "System" | "Invalid";
				Id?: string;
		  }
		| string;
	ChannelId: string;
	ChannelType: "PlatformChatGroup" | "LiveChannelGroupUp" | "PlatformChatOneToOne";
	ChannelVertical?: "PlatformChat";
	ParentChannelId?: string;
	RootChannelId?: string;
	NotificationTags?: { type: "group" | "one_to_one" };
	PreviousChannelStatus?: {
		ParentChannelId: string;
		RootChannelId: string;
	};
	IsLiveChannel?: false;
};

export type RealtimeNotificationsExperienceInviteUpdateInformation = BaseNotification & {
	requestId: string | null;
	experienceInviteId: string;
	state: "Reserving" | "ReservationSuccessful";
	experienceDetail: {
		placeId: number;
		gameInstanceId: string | null;
	};
	versionId: number;
	inviterId: number;
	createdAtTime: string;
	totalSpots: number;
	membershipEntityId: string;
	votes: {
		userId: number;
		voteType: "Accept" | "Decline";
		deviceType: null;
		ipAddress: null;
		voteIdentifier: string;
	}[];
	allUserIds: number[] | null;
};

export type RealtimeNotificationsUserSettingsChangedInformation = BaseNotification & {
	SettingsChanged: string[];
};

export type RealtimeNotificationsActivityHistoryEventInformation = BaseNotification & {
	CreatedUnixTimeMs: number;
	EventType: number;
	Id: string | null;
	// json
	MetaData: string;
	OrganizationId: string | null;
	PlaceId: number;
	ResourceId: string | null;
	UniverseId: number;
	UserId: number;
};

export type RealtimeNotifications =
	| ["ChatNotifications", RealtimeNotificationsChatNotificationsInformation]
	| ["CloudEditChatNotifications", RealtimeNotificationsChatNotificationsInformation]
	| [
			"ChatPrivacySettingNotifications",
			RealtimeNotificationsChatPrivacySettingNotificationInformation,
	  ]
	| ["PresenceBulkNotifications", RealtimeNotificationsPresenceNotificationInformation[]]
	| ["UserTagChangeNotification", RealtimeNotificationsUserTagChangeNotificationInformation]
	| ["FriendshipNotifications", RealtimeNotificationsFriendshipNotificationInformation]
	| ["NotificationStream", RealtimeNotificationsNotificationStreamInformation]
	| ["AuthenticationNotifications", RealtimeNotificationsAuthenticationNotificationInformation]
	| [
			"UserThemeTypeChangeNotification",
			RealtimeNotificationsUserThemeTypeChangeNotificationInformation,
	  ]
	| [
			"AvatarOutfitOwnershipNotifications",
			RealtimeNotificationsAvatarOutfitOwnershipNotificationInformation,
	  ]
	| [
			"AvatarAssetOwnershipNotifications",
			RealtimeNotificationsAvatarAssetOwnershipNotificationInformation,
	  ]
	| ["GameCloseNotifications", RealtimeNotificationsGameCloseNotificationInformation]
	| ["GameFavoriteNotifications", RealtimeNotificationsGameFavoriteNotificationInformation]
	| ["MessageNotification", RealtimeNotificationsMessageNotificationInformation]
	| ["DisplayNameNotifications", RealtimeNotificationsDisplayNameNotificationInformation]
	| ["AdhocNotifications.GroupWall", RealtimeNotificationsGroupWallNotificationInformation]
	| ["AdhocNotifications", RealtimeNotificationsAdhocNotificationInformation]
	// Parties are no longer implemented | ["PartyNotifications", RealtimeNotificationsPartyNotificationInformation]
	| ["ScreenTimeClientNotifications", unknown] // Don't know the type
	// No longer returned | ["VoiceNotifications", RealTimeNotificationssVoiceNotificationsInformation]
	| ["RevenueReports", unknown] // Don't know the type
	| ["MachineLearningChat", RealtimeNotificationsMachineLearningChatInformation]
	| ["CallNotification", RealtimeNotificationsCallNotificationInformation]
	| ["toast-in-app-and-experience-desktop-notifications", ToastDesktopNotificationInformation]
	| ["AssetUpdate", AssetUpdateNotificationInformation]
	| ["toast-in-app-and-experience-notifications", ToastDesktopNotificationInformation]
	| ["AvatarAutoSetupCompletion", AvatarAutoSetupCompleteInformation]
	| ["UserProfiileNotifications", RealtimeNotificationsUserProfileNotificationsInformation]
	| ["ExperienceInviteUpdate", RealtimeNotificationsExperienceInviteUpdateInformation]
	| ["CommunicationChannels", RealtimeNotificationsCommunicationChannelsInformation]
	| ["UserSettingsChanged", RealtimeNotificationsUserSettingsChangedInformation]
	| ["ActivityHistoryEvent", RealtimeNotificationsActivityHistoryEventInformation]
	| ["EligibilityStatusChanged", unknown] // don't know the type...
	| ["ChatModerationTypeEligibility", unknown] // Dont know the type
	| ["PostCreationNotification", unknown] /// same....
	| ["toast-in-experience-notifications", unknown]; // Same....

export type SendExperienceInviteNotificationRequest = {
	recipientUserId: number;
	trigger: "GameMenu" | "DeveloperMultiple" | "DeveloperSingle";
	placeId: number;
	idempotencyKey?: string;
};

export type ListRecentStreamNotificationsRequest = {
	startIndex: number;
	maxRows: number;
};

// for the most part this type is incomplete. I only need the notification type rn
export type ListedStreamNotification = {
	id: string;
	notificationSourceType: "Sendr";
	eventDate: string;
	timestamp: string;
	isInteracted: boolean;
	metadataCollection: [1];
	eventCount: number;
	content: {
		notificationType: "ExperienceInvitation" | "SpecialItem";
		currentState: "default";
	};
};

export function getRealtimeSubscriptionEventCounts() {
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(
			httpClient.formatRequestUrl(
				{
					url: getRobloxUrl("realtime-signalr", "/userhub"),
				},
				"wss",
			),
		);
		ws.onopen = () => {
			ws.send(
				`${JSON.stringify({
					protocol: "json",
					version: 1,
				})}`,
			);
		};
		ws.onmessage = (e) => {
			const data = JSON.parse(e.data.substring(0, e.data.length - 1));
			if (data.target === "subscriptionStatus") {
				ws.close();
				if (data.arguments[0] === "Subscribed") {
					return resolve(JSON.parse(data.arguments[1]).NamespaceSequenceNumbers);
				}

				reject();
			}
		};
	});
}

export async function sendExperienceInviteNotification(
	data: SendExperienceInviteNotificationRequest,
) {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: getRobloxUrl("apis", "/notifications/v1/send-experience-invite"),
		body: {
			type: "json",
			value: data,
		},
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
		errorHandling: "BEDEV2",
	});
}

export async function listRecentStreamNotifications(request: ListRecentStreamNotificationsRequest) {
	return (
		await httpClient.httpRequest<ListedStreamNotification[]>({
			url: getRobloxUrl("notifications", "/v2/stream-notifications/get-recent"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}
