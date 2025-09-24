import type { DurationFormat } from "@formatjs/intl-durationformat";
import type Angular from "angular";
import type IntlMessageFormat from "intl-messageformat";
import type React from "react";
import type { AvatarAssetDefinitionWithTypes } from "src/ts/helpers/requests/services/avatar";
import type { GameJoinAttemptOrigin } from "src/ts/helpers/requests/services/join";
import type { SendServerJoinData } from "src/ts/utils/gameLauncher";

declare global {
	declare const browser: typeof chrome;
	declare type MappedOmit<T, K extends keyof T> = {
		[P in keyof T as P extends K ? never : P]: T[P];
	};
	declare type OmitExtend<T, K, U extends keyof K = keyof K> = MappedOmit<T, U> & K;
	// biome-ignore lint/suspicious/noExplicitAny: Need to have `any` here
	declare type Writeable<T extends { [x: string]: any }, K extends string> = {
		[P in K]: T[P];
	};
	// biome-ignore lint/suspicious/noExplicitAny: Need to have `any` here
	declare type AnyFunction = (...args: any[]) => any;
	declare type MaybePromise<T> = T | Promise<T>;
	declare type MaybeNestedPromise<T> =
		| T
		| Promise<T>
		| Promise<Promise<T> | undefined>
		| Promise<T | undefined>;
	declare type MaybeDeepPromise<T> = T | Promise<MaybeDeepPromise<T> | undefined>;

	declare type Writable<T> = { -readonly [P in keyof T]: T[P] };
	declare type Split<S extends string, D extends string> = string extends S
		? string[]
		: S extends ""
			? []
			: S extends `${infer T}${D}${infer U}`
				? [T, ...Split<U, D>]
				: [S];
	interface Window {
		jQuery: {
			fn: {
				// biome-ignore lint/suspicious/noExplicitAny: Not sure yet
				highcharts: (args: any) => any;
			};
		};
		$: {
			Deferred: () => {
				resolve: () => void;
				reject: () => void;
			};
		} & ((type: unknown) => {
			triggerHandler: (type: string, args: unknown) => void;
		});
		webpackChunk_N_E: [
			[number],
			Record<string, (arg: { exports: unknown }) => void>,
			AnyFunction?,
		][];
		angular: typeof Angular;
		Intl: {
			MessageFormat: typeof IntlMessageFormat;
			DurationFormat: typeof DurationFormat;
		};
		ReactUtilities: {
			useTheme: () => unknown;
		};
		RobloxPresence: {
			PresenceType: {
				Offline: number;
				Invisible: number;
				0: string;
				4: string;
			};
			PresenceStatusIcon: () => React.JSX.Element;
		};
		content: {
			fetch: typeof window.fetch;
		};
		Roblox: {
			ProtocolHandlerClientInterface: {
				playerChannel: string;
				channel: string;
				studioChannel: string;

				joinMultiplayerGame: (data: {
					placeId: number;
					isPlayTogetherGame?: boolean;
					joinAttemptId?: string;
					joinAttemptOrigin?: GameJoinAttemptOrigin;
					launchData?: string;
					eventId?: string;
					referredByPlayerId?: number;
				}) => void;
				followPlayerIntoGame: (data: {
					userId: number;
					joinAttemptId?: string;
					joinAttemptOrigin?: GameJoinAttemptOrigin;
				}) => void;
				joinGameInstance: (data: {
					placeId: number;
					gameId: string;
					isPlayTogetherGame?: boolean;
					joinAttemptId?: string;
					joinAttemptOrigin?: GameJoinAttemptOrigin;
					referredByPlayerId?: number;
				}) => void;
				joinPrivateGame: (data: {
					placeId: number;
					accessCode?: string;
					linkCode?: string;
					joinAttemptId?: string;
					joinAttemptOrigin?: GameJoinAttemptOrigin;
				}) => void;
			};
			GameLauncher: {
				joinMultiplayerGame: (
					placeId: number,
					isMembershipLevelOk?: boolean,
					isPlayTogetherGame?: boolean,
					joinAttemptId?: string,
					joinAttemptOrigin?: GameJoinAttemptOrigin,
					joinData?: SendServerJoinData,
					referredByPlayerId?: number,
				) => void;
				followPlayerIntoGame: (
					userId: number,
					joinAttemptId?: string,
					joinAttemptOrigin?: GameJoinAttemptOrigin,
				) => void;
				joinGameInstance: (
					placeId: number,
					gameId: string,
					isMembershipLevelOk?: boolean,
					isPlayTogetherGame?: boolean,
					joinAttemptId?: string,
					joinAttemptOrigin?: GameJoinAttemptOrigin,
					referredByPlayerId?: number,
				) => void;
				joinPrivateGame: (
					placeId: number,
					accessCode?: string,
					linkCode?: string,
					joinAttemptId?: string,
					joinAttemptOrigin?: GameJoinAttemptOrigin,
				) => void;
			};
			"core-scripts": {
				intl: {
					translation: {
						TranslationResource: {
							prototype: {
								get: (key: string) => void;
							};
						};
					};
				};
			};
			GameLauncher: unknown;
			SearchLandingService: {
				mountSearchLanding: () => void;
			};
			ui: {
				createCache: () => unknown;
				CacheProvider: (props: { cache: unknown }) => JSX.Element;
				UIThemeProvider: (props: { theme: unknown }) => JSX.Element;
			};
			GamePassItemPurchase: {
				openPurchaseVerificationView: (el: HTMLElement, type: "game-pass") => void;
			};
			CrossTabCommunication?: {
				Kingmaker?: {
					IsMasterTab: () => boolean;
					SubscribeToMasterChange: (callback: (value: boolean) => void) => void;
				};
			};
			AvatarAccoutrementService: {
				buildMetaForAsset: (
					asset: AvatarAssetDefinitionWithTypes,
					assets: AvatarAssetDefinitionWithTypes[],
					replaceSameType = true,
				) => AvatarAssetDefinitionWithTypes;
				insertAssetMetaIntoAssetList: (
					asset: AvatarAssetDefinitionWithTypes,
					assetList: AvatarAssetDefinitionWithTypes[],
				) => AvatarAssetDefinitionWithTypes[];
				addAssetToAvatar: (
					assetToWear: AvatarAssetDefinitionWithTypes,
					assetList: AvatarAssetDefinitionWithTypes[],
					clearAssetsOfSameType?: boolean,
					allowMoreThanMaxPerAsset?: boolean,
				) => AvatarAssetDefinitionWithTypes[];
				buildMetaForAssets: (
					assetList: AvatarAssetDefinitionWithTypes[],
					preserveMeta?: boolean,
					layeredClothingAssetList?: unknown[],
				) => AvatarAssetDefinitionWithTypes[];
			};
			RealTime: {
				Factory: {
					GetClient: () => {
						// biome-ignore lint/suspicious/noExplicitAny: Lol
						Subscribe: (namespace: string, handler: (data: any) => void) => void;
						Unsubscribe: (namespace: string, handler: (data: unknown) => void) => void;
						SubscribeToConnectionEvents: (
							onConnectionHandler: (dataReloadRequired: boolean) => void,
							onReconnectedHandler: (dataReloadRequired: boolean) => void,
							onDisconnectedHandler: (dataReloadRequired: boolean) => void,
							namespace: string,
						) => void;
						DetectSignalConnection: (onSignalRConnection: () => void) => void;
						IsConnected: (namespace?: string) => boolean;
						SetLogger: (loggerCallback: (message: unknown) => void) => void;
						SetVerboseLogging: (newValue: boolean) => void;
					};
				};
				GetNotificationsUrl: () => string;
				GetMaximumConnectionTime: () => number;
				IsEventPublishingEnabled: () => boolean;
				IsLocalStorageEnabled: () => boolean;
				GetUserId: () => number;
				GetSettings: () => {
					notificationsUrl: string;
					maxConnectionTimeInMs: number;
					isEventPublishingEnabled: boolean;
					isDisconnectOnSlowConnectionEnabled: boolean;
					userId: number;
					isSignalRClientTransportRestrictionEnabled: boolean;
					isLocalStorageEnabled: boolean;
				};
			};
			DeviceMeta?: () => Record<string, string | boolean>;
			Seal?: () => void;
			Cat?: () => void;
			Lang: Record<string, Record<string, string>>;
			LangDynamic: Record<string, Record<string, string>>;
			LangDynamicDefault: Record<string, Record<string, string>>;
			Linkify: {
				String: (str: string) => string;
			};
			AccountIntegrityChallengeService?: {
				Generic?: {
					interceptChallenge?: (args: {
						retryRequest: (
							challengeId: string,
							challengeMetadataJsonBase64: string,
							// biome-ignore lint/suspicious/noExplicitAny: Not sure yet
						) => any;
						containerId: string;
						challengeId: string;
						challengeTypeRaw: string;
						challengeMetadataJsonBase64: string;
						// biome-ignore lint/suspicious/noExplicitAny: Not sure yet
					}) => Promise<any>;
				};
				TwoStepVerification?: {
					// biome-ignore lint/suspicious/noExplicitAny: Not sure yet
					renderChallenge?: (args: any) => boolean;
				};
				Captcha?: {
					// biome-ignore lint/suspicious/noExplicitAny: Not sure yet
					renderChallenge?: (args: any) => boolean;
				};
			};
		};
		React: typeof React;
		ReactJSX: typeof React;
		ReactDOM: typeof React;

		CoreUtilities: {
			abbreviateNumber: {
				getTruncValue: (
					value: number,
					abbreviationThresold?: number,
					suffixType?: unknown,
					digitsAfterDecimalPoint?: number,
				) => string;
			};
		};

		RobloxThumbnail3d?: {
			Thumbnail3d: React.ComponentType<{
				targetId: number;
				getThumbnailJson: () => {
					data: unknown;
				};
			}>;
			thumbnail3dService?: {
				loadObjAndMtl3D?: (
					targetId: number,
					element: HTMLElement,
					json: unknown,
					useDynamicLighting: boolean,
				) => [HTMLCanvasElement] | undefined;
			};
		};
	}
}
