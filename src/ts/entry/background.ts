import { connectToDevServer } from "../helpers/devServerConnection";

if (import.meta.env.IS_DEV_WS_ACCESSIBLE) {
	connectToDevServer("Reload", () => {
		browser.runtime.reload();
	});

	keepAliveServiceWorker();
}

import { alarmListeners } from "#pages/background-alarms";
import { messageListeners } from "#pages/background-listeners";
import type { AuthenticatedUserWithCreatedAndBadge } from "src/types/dataTypes";
import {
	ACCOUNTS_DISCOVERY_FEATURE_ID,
	ACCOUNTS_FEATURE_ID,
	ACCOUNTS_RULES_SESSION_CACHE_STORAGE_KEY,
	ACCOUNTS_RULES_START_ID,
	ACCOUNTS_UPDATE_TABS_FEATURE_ID,
	type AccountsRulesStorageValue,
	ROBLOX_ACCOUNT_LIMIT,
	ROBLOX_COOKIES,
	ROSEAL_ACCOUNT_TOKEN_SEARCH_PARAM_NAME,
	SET_COOKIE_STORE_DOMAIN,
	type StoredAccount,
	UNENCRYPTED_ACCOUNTS_STORAGE_KEY,
} from "../constants/accountsManager";
import { ACCOUNT_TRACKING_PREVENTION_FEATURE_ID } from "../constants/accountTrackingPrevention";
import {
	FRIENDS_LAST_SEEN_BACKGROUND_CHECKS_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_NOTIFICATION_PREFIX,
	USER_ONLINE_FRIENDS_FETCH_ALARM_NAME,
} from "../constants/friends";
import {
	ONBOARDING_COMPLETED_STORAGE_KEY,
	STARTUP_NOTIFICATION_HAS_OPENED_ROBLOX_SESSION_STORAGE_KEY as STARTUP_NOTIFICATION_HAS_NOTIFICATION_SESSION_STORAGE_KEY,
	STARTUP_NOTIFICATION_NOTIFICATION_PREFIX,
	STARTUP_NOTIFICATIONS_FEATURE_ID,
	VERSION_STORAGE_KEY,
} from "../constants/misc";
import {
	COMMUNITY_SHOUT_NOTIFICATIONS_ALARM_NAME,
	COMMUNITY_SHOUT_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	COMMUNITY_SHOUT_NOTIFICATIONS_NOTIFICATION_PREFIX,
} from "../constants/communities";
import {
	TRADING_NOTIFICATIONS_ALARM_NAME,
	TRADING_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	TRADING_NOTIFICATIONS_NOTIFICATION_PREFIX,
} from "../constants/trades";
import { EXTENSION_INSTALLATION_ID_STORAGE_KEY } from "../constants/sync";
import { invokeMessage } from "../helpers/communication/main";
import { onFeatureValueUpdate } from "../helpers/features/features";
import {
	featureValueIs,
	featureValueIsLater,
	getFeatureValue,
	multigetFeaturesValues,
} from "../helpers/features/helpers";
import { getMessage } from "../helpers/i18n/getMessage";
import { backgroundLocalesLoaded } from "../helpers/i18n/locales";
import { migrateStorage } from "../helpers/migrateStorage";
import { handleAlarmListeners } from "../helpers/pages/handleAlarmListeners";
import { handleBackgroundListeners } from "../helpers/pages/handleBackgroundListeners";
import { currentPermissions } from "../helpers/permissions";
import { getCurrentAuthenticatedUser } from "../helpers/requests/services/account";
import {
	getExtensionSessionStorage,
	onStorageValueUpdate,
	setExtensionSessionStorage,
	storage,
} from "../helpers/storage";
import { fetchOnlineFriendsAndUpdateData } from "../pages/background-alarms/fetchOnlineFriends";
import {
	handleAccountTrackingProtectionAccount,
	handleAccountTrackingProtectionEnabled,
} from "../utils/background/accountTrackingPrevention";
import {
	getCurrentCookies,
	listRobloxAccounts,
	updateRobloxAccounts,
} from "../utils/background/cookies";
import { keepAliveServiceWorker } from "../utils/background/misc";
import { getRobloxUrl } from "../utils/baseUrls" with { type: "macro" };
import { deepLinksParser } from "../utils/deepLinks";
import {
	getGroupProfileLink,
	getHomePageUrl,
	getRoSealSettingsLink,
	getTradesLink,
	getUserProfileLink,
} from "../utils/links";
import { randomSHA256 } from "../utils/random";
import {
	AVATAR_ITEM_REGEX,
	AVATAR_MARKETPLACE_REGEX,
	EXPERIENCE_DEEPLINK_REGEX,
	EXPERIENCE_DETAILS_REGEX,
	REQUEST_ERROR_REGEX,
	USER_PROFILE_REGEX,
} from "../utils/regex";
import { getPath } from "../utils/url";

// Listeners and stuff
if ("setAccessLevel" in browser.storage.session && import.meta.env.TARGET_BASE !== "firefox")
	browser.storage.session.setAccessLevel({
		accessLevel: browser.storage.AccessLevel.TRUSTED_AND_UNTRUSTED_CONTEXTS,
	});

handleBackgroundListeners(messageListeners);
handleAlarmListeners(alarmListeners);

(import.meta.env.TARGET_BASE !== "firefox"
	? browser.action
	: browser.browserAction
).onClicked.addListener(() => {
	browser.tabs.create({
		url: getRoSealSettingsLink(),
	});
});

// Tab redirects for mulitple features
function handleTabRedirect() {
	browser.webRequest.onBeforeRequest.addListener(
		// @ts-expect-error: documentLifecycle is not in the type
		(detail) => {
			if (detail.documentLifecycle === "prerender") {
				return;
			}

			featureValueIs("fixExperienceDeeplinks.useMainPage", true, () => {
				const fromURL = new URL(detail.url);
				if (EXPERIENCE_DEEPLINK_REGEX.test(fromURL.pathname)) {
					const placeId = fromURL.searchParams.get("placeId");
					if (placeId) {
						fromURL.pathname = fromURL.pathname.replace(/start$/, `${placeId}/name`);
						fromURL.searchParams.delete("placeId");
						fromURL.searchParams.set("start", "true");

						browser.tabs.update(detail.tabId, {
							url: fromURL.toString(),
						});
					}
				}
			});
		},
		{
			urls: [`https://${getRobloxUrl("www", "/*")}`],
		},
	);

	browser.webRequest.onBeforeRedirect.addListener(
		(detail) => {
			if (detail.type !== "main_frame") {
				return;
			}

			multigetFeaturesValues([
				"experienceRestrictedScreen",
				"viewHiddenAvatarItems",
				"previewUserDeletedProfile",
			]).then((data) => {
				if (
					!data.viewHiddenAvatarItems &&
					!data.experienceRestrictedScreen &&
					!data.previewUserDeletedProfile
				) {
					return;
				}

				const fromURL = new URL(detail.url);
				const toURL = new URL(detail.redirectUrl);
				const fromPath = getPath(fromURL.pathname);
				const toPath = getPath(toURL.pathname);

				const is404Error =
					REQUEST_ERROR_REGEX.test(toPath.realPath) &&
					toURL.searchParams.get("code") === "404";
				if (data.viewHiddenAvatarItems && AVATAR_MARKETPLACE_REGEX.test(toPath.realPath)) {
					const match = AVATAR_ITEM_REGEX.exec(fromPath.realPath)?.[1];
					if (match !== "catalog" && match !== "bundles") {
						return;
					}

					const newUrl = new URL(detail.url);
					newUrl.pathname = newUrl.pathname
						.replace(/\/catalog/i, "/hidden-catalog")
						.replace(/\/bundles/i, "/hidden-bundles");

					if (newUrl.toString() === detail.url) {
						return;
					}

					browser.tabs.update(detail.tabId, {
						url: newUrl.toString(),
					});
				} else if (is404Error) {
					if (
						data.experienceRestrictedScreen &&
						EXPERIENCE_DETAILS_REGEX.test(fromPath.realPath)
					) {
						const newUrl = new URL(detail.url);
						newUrl.pathname = newUrl.pathname.replace(/\/games/i, "/games/check");

						browser.tabs.update(detail.tabId, {
							url: newUrl.toString(),
						});
					} else if (
						data.previewUserDeletedProfile &&
						USER_PROFILE_REGEX.test(fromPath.realPath)
					) {
						const newUrl = new URL(detail.url);
						newUrl.pathname = newUrl.pathname.replace(/\/users/i, "/deleted-users");

						browser.tabs.update(detail.tabId, {
							url: newUrl.toString(),
						});
					}
				}
			});
		},
		{
			urls: [`https://${getRobloxUrl("www", "/*")}`],
		},
	);
}
handleTabRedirect();

async function onPermissionsUpdated() {
	const permissions = await browser.permissions.getAll();
	currentPermissions.value = permissions;

	for (const tab of await browser.tabs.query({
		url: `https://${getRobloxUrl("*", "/*")}`,
	})) {
		if (tab.id === undefined) continue;

		invokeMessage(tab.id, "permissionsUpdated", permissions);
	}
}

browser.permissions.onAdded.addListener((data) => {
	if (data.permissions?.includes("cookies") && !browser.cookies) {
		setTimeout(handleCookiesChange, 100);
	}

	if (data.permissions?.includes("notifications") && !browser.notifications) {
		setTimeout(handleNotificationsChange, 100);
	}

	onPermissionsUpdated();
});

browser.permissions.onRemoved.addListener(onPermissionsUpdated);

browser.runtime.onInstalled.addListener(async (details) => {
	if (details.reason === "update") {
		if (details.previousVersion?.startsWith("1")) {
			const onboardingValue = (await storage.get(ONBOARDING_COMPLETED_STORAGE_KEY))?.[
				ONBOARDING_COMPLETED_STORAGE_KEY
			];
			if (onboardingValue !== true)
				storage.set({
					[ONBOARDING_COMPLETED_STORAGE_KEY]: "previousVersion",
				});
		}
		await storage.get(EXTENSION_INSTALLATION_ID_STORAGE_KEY).then(async (installationId) => {
			if (!installationId) {
				storage.set({
					[EXTENSION_INSTALLATION_ID_STORAGE_KEY]: crypto.randomUUID(),
				});
			}
		});
		await storage.get(VERSION_STORAGE_KEY).then(async (data) => {
			if (!data?.[VERSION_STORAGE_KEY]) {
				const allData = await storage.get();
				const migrated = migrateStorage(allData, allData);

				return Promise.all([
					storage.set(migrated.newValue),
					storage.remove(migrated.deleteKeys),
				]);
			}
		});
	}

	if (details.reason === "update" || details.reason === "install") {
		storage.set({
			[VERSION_STORAGE_KEY]: 2,
		});
	}

	if (details.reason === "install") {
		browser.tabs.create({
			url: getHomePageUrl(),
			active: true,
		});
	}
});

// Accounts tracking prevention
featureValueIs(ACCOUNT_TRACKING_PREVENTION_FEATURE_ID, true, () =>
	handleAccountTrackingProtectionEnabled(true),
);
onFeatureValueUpdate([ACCOUNT_TRACKING_PREVENTION_FEATURE_ID], async () => {
	handleAccountTrackingProtectionEnabled(
		(await getFeatureValue(ACCOUNT_TRACKING_PREVENTION_FEATURE_ID)) === true,
	);
});

// Accounts manager
async function handleAuthenticatedUserChange(_data?: AuthenticatedUserWithCreatedAndBadge | null) {
	let data = _data;

	if (data === undefined) {
		for (const tab of await browser.tabs.query({
			url: `https://${getRobloxUrl("*", "/*")}`,
		})) {
			if (tab.id === undefined) continue;

			if (!data) {
				try {
					const response = await invokeMessage(tab.id, "getAuthenticatedUser", undefined);
					if (response.reason === "NotAuthenticated") {
						data = null;
						break;
					}

					data = response.data;
				} catch {}
				if (data) {
					break;
				}
			}
		}
	}

	if (data !== undefined) {
		for (const tab of await browser.tabs.query({
			url: `https://${getRobloxUrl("*", "/*")}`,
		})) {
			if (tab.id === undefined) continue;

			invokeMessage(tab.id, "authenticatedUserUpdated", data || undefined).catch(() => {});
		}
	}
}

async function handleCookiesChange() {
	let abortController: AbortController | undefined;
	browser.cookies.onChanged.addListener((cookie) => {
		if (
			ROBLOX_COOKIES.find((cookie) => cookie.required)?.name === cookie.cookie.name &&
			cookie.cookie.domain === SET_COOKIE_STORE_DOMAIN &&
			cookie.cause === "explicit"
		) {
			featureValueIs(
				FRIENDS_LAST_SEEN_BACKGROUND_CHECKS_FEATURE_ID,
				true,
				fetchOnlineFriendsAndUpdateData,
			);

			featureValueIs(ACCOUNT_TRACKING_PREVENTION_FEATURE_ID, true, () =>
				handleAccountTrackingProtectionAccount(),
			);

			featureValueIs(ACCOUNTS_FEATURE_ID, true, async () => {
				abortController?.abort();
				abortController = new AbortController();

				const features = await multigetFeaturesValues([
					ACCOUNTS_DISCOVERY_FEATURE_ID,
					ACCOUNTS_UPDATE_TABS_FEATURE_ID,
				]);
				const discoverAccounts = features[ACCOUNTS_DISCOVERY_FEATURE_ID];
				const updateTabs = features[ACCOUNTS_UPDATE_TABS_FEATURE_ID];

				if (!discoverAccounts && !updateTabs) {
					abortController = undefined;
					return;
				}

				const [cookies, accounts] = await Promise.all([
					getCurrentCookies(),
					listRobloxAccounts(),
				]);

				const idCookie = ROBLOX_COOKIES.find((cookie) => cookie.required)!;
				const cookie = cookies.find((cookie) => cookie.name === idCookie.name);

				if (abortController.signal.aborted) return;
				if (!cookie) {
					if (updateTabs) {
						handleAuthenticatedUserChange(null);
					}
					abortController = undefined;
					return;
				}

				for (const account of accounts) {
					for (const cookie2 of account.cookies) {
						if (cookie2.name === idCookie.name && cookie2.value === cookie.value) {
							if (updateTabs) {
								handleAuthenticatedUserChange();
							}
							abortController = undefined;
							return;
						}
					}
				}

				for (const tab of await browser.tabs.query({
					url: `https://${getRobloxUrl("*", "/*")}`,
				})) {
					if (!tab.id) {
						continue;
					}

					try {
						const data = await invokeMessage(tab.id, "getAuthenticatedUser", undefined);

						if (abortController?.signal.aborted) return;
						if (data.reason === "NotAuthenticated") {
							if (updateTabs) {
								handleAuthenticatedUserChange(null);
							}
							abortController = undefined;
							return;
						}

						let hasExistingAccount = false;
						for (const account of accounts) {
							if (account.userId === data.data.id) {
								if (discoverAccounts) {
									hasExistingAccount = true;
									account.cookies = cookies;
								}

								break;
							}
						}

						if (updateTabs) handleAuthenticatedUserChange(data.data);

						if (discoverAccounts) {
							if (!hasExistingAccount && accounts.length < ROBLOX_ACCOUNT_LIMIT) {
								accounts.push({
									cookies,
									userId: data.data.id,
								});
							}
							abortController = undefined;
							return updateRobloxAccounts(accounts);
						}
					} catch {}
				}

				abortController = undefined;
			});
		}
	});
}

if (browser.cookies) {
	handleCookiesChange();
}

function handleNotificationsChange() {
	browser.notifications.onButtonClicked.addListener((notificationId) => {
		const split = notificationId.split(":");
		if (!split[1]) return;

		if (notificationId.startsWith(FRIENDS_PRESENCE_NOTIFICATIONS_NOTIFICATION_PREFIX)) {
			const url = deepLinksParser()
				.createDeepLink("joinUser", {
					userId: split[1],
					joinAttemptOrigin: "RoSealActivityNotification",
					joinAttemptId: crypto.randomUUID(),
				})
				?.toProtocolUrl();
			if (!url) return;

			browser.tabs.create({
				url,
				active: true,
			});
		}
	});
	browser.notifications.onClicked.addListener((notificationId) => {
		const split = notificationId.split(":");
		if (!split[1]) return;

		if (notificationId.startsWith(COMMUNITY_SHOUT_NOTIFICATIONS_NOTIFICATION_PREFIX)) {
			browser.tabs.create({
				url: getGroupProfileLink(Number.parseInt(split[1], 10)),
				active: true,
			});
		} else if (notificationId.startsWith(FRIENDS_PRESENCE_NOTIFICATIONS_NOTIFICATION_PREFIX)) {
			browser.tabs.create({
				url: getUserProfileLink(Number.parseInt(split[1], 10)),
				active: true,
			});
		} else if (notificationId.startsWith(TRADING_NOTIFICATIONS_NOTIFICATION_PREFIX)) {
			browser.tabs.create({
				url: getTradesLink(split[1]),
			});
		}
	});
}

if (browser.notifications) {
	handleNotificationsChange();
}

async function updateAccountIdsCookies() {
	const [tokens, accounts, rules] = await Promise.all([
		browser.storage.session
			.get(ACCOUNTS_RULES_SESSION_CACHE_STORAGE_KEY)
			.then(
				(data) =>
					(data[ACCOUNTS_RULES_SESSION_CACHE_STORAGE_KEY] as AccountsRulesStorageValue) ??
					{},
			),
		storage
			.get(UNENCRYPTED_ACCOUNTS_STORAGE_KEY)
			.then((data) => data[UNENCRYPTED_ACCOUNTS_STORAGE_KEY] as StoredAccount[] | undefined),
		browser.declarativeNetRequest.getDynamicRules(),
	]);

	const allRuleIds: number[] = [];
	const removeRuleIds: number[] = [];

	for (const key in tokens) {
		const value = tokens[key];
		const userId = Number.parseInt(key, 10);

		let hasAccount = false;
		if (accounts)
			for (const account of accounts) {
				if (account.userId === userId) {
					hasAccount = true;
					break;
				}
			}

		if (!hasAccount) {
			removeRuleIds.push(value.ruleId);
			delete tokens[key];
		}
	}

	for (const rule of rules) {
		if (rule.id >= ACCOUNTS_RULES_START_ID && !removeRuleIds.includes(rule.id)) {
			removeRuleIds.push(rule.id);
		}
	}

	const addRules: chrome.declarativeNetRequest.Rule[] = [];
	if (accounts) {
		let currRuleId = ACCOUNTS_RULES_START_ID;
		for (const account of accounts) {
			let cookieValue = "";
			for (const cookie of account.cookies) {
				const metadata = ROBLOX_COOKIES.find((cookie2) => cookie.name === cookie2.name);

				cookieValue += `${cookie.name}=${metadata?.prefix || ""}${cookie.value};`;
			}

			tokens[account.userId] ??= {
				token: await randomSHA256(12),
				ruleId: ++currRuleId,
			};

			const { token, ruleId } = tokens[account.userId];
			addRules.push({
				id: ruleId,
				priority: 2,
				action: {
					type: "modifyHeaders",
					requestHeaders: [
						{
							header: "cookie",
							operation: "append",
							value: cookieValue,
						},
					],
				},
				condition: {
					urlFilter: `||${getRobloxUrl("").substring(1)}/*${ROSEAL_ACCOUNT_TOKEN_SEARCH_PARAM_NAME}=${token}`,
					resourceTypes: ["xmlhttprequest"],
				},
			});
			allRuleIds.push(ruleId);
		}
	}

	await Promise.all([
		browser.declarativeNetRequest.updateDynamicRules({
			removeRuleIds,
			addRules,
		}),
		browser.storage.session.set({
			[ACCOUNTS_RULES_SESSION_CACHE_STORAGE_KEY]: tokens,
		}),
	]);

	return () =>
		browser.declarativeNetRequest.updateDynamicRules({
			removeRuleIds: allRuleIds,
		});
}

onStorageValueUpdate([UNENCRYPTED_ACCOUNTS_STORAGE_KEY], () => {
	featureValueIs(ACCOUNTS_FEATURE_ID, true, updateAccountIdsCookies);
});
featureValueIsLater(ACCOUNTS_FEATURE_ID, true, updateAccountIdsCookies);

async function checkFriendsCheckingBackground() {
	const data = await multigetFeaturesValues([
		FRIENDS_LAST_SEEN_BACKGROUND_CHECKS_FEATURE_ID,
		FRIENDS_PRESENCE_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	]);
	const existingAlarm = await browser.alarms.get(USER_ONLINE_FRIENDS_FETCH_ALARM_NAME);
	const isEnabled =
		data[FRIENDS_LAST_SEEN_BACKGROUND_CHECKS_FEATURE_ID] ||
		data[FRIENDS_PRESENCE_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID];

	if (!isEnabled && existingAlarm) {
		await browser.alarms.clear(USER_ONLINE_FRIENDS_FETCH_ALARM_NAME);
	} else if (isEnabled && !existingAlarm) {
		await browser.alarms.create(USER_ONLINE_FRIENDS_FETCH_ALARM_NAME, {
			periodInMinutes: 2,
		});
	}
}

checkFriendsCheckingBackground();
onFeatureValueUpdate(
	[
		FRIENDS_LAST_SEEN_BACKGROUND_CHECKS_FEATURE_ID,
		FRIENDS_PRESENCE_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	],
	checkFriendsCheckingBackground,
);

// Friends last seen background stuff
featureValueIsLater(FRIENDS_LAST_SEEN_BACKGROUND_CHECKS_FEATURE_ID, true, async () => {
	if (!(await browser.alarms.get(USER_ONLINE_FRIENDS_FETCH_ALARM_NAME))) {
		await browser.alarms.create(USER_ONLINE_FRIENDS_FETCH_ALARM_NAME, {
			periodInMinutes: 2,
		});
	}
	return () => browser.alarms.clear(USER_ONLINE_FRIENDS_FETCH_ALARM_NAME);
});

// Shout notifications
featureValueIsLater(COMMUNITY_SHOUT_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID, true, async () => {
	if (!(await browser.alarms.get(COMMUNITY_SHOUT_NOTIFICATIONS_ALARM_NAME))) {
		await browser.alarms.create(COMMUNITY_SHOUT_NOTIFICATIONS_ALARM_NAME, {
			periodInMinutes: 20,
		});
	}
	return () => browser.alarms.clear(COMMUNITY_SHOUT_NOTIFICATIONS_ALARM_NAME);
});

// Trade notifications
featureValueIsLater(TRADING_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID, true, async () => {
	if (!(await browser.alarms.get(TRADING_NOTIFICATIONS_ALARM_NAME))) {
		await browser.alarms.create(TRADING_NOTIFICATIONS_ALARM_NAME, {
			periodInMinutes: 5,
		});
	}
	return () => browser.alarms.clear(TRADING_NOTIFICATIONS_ALARM_NAME);
});

// Startup notifications
featureValueIsLater(STARTUP_NOTIFICATIONS_FEATURE_ID, [true], async (value) => {
	if (!value?.[0]) return () => {};

	await backgroundLocalesLoaded;
	const checkHasGotNotification = () =>
		getExtensionSessionStorage<boolean>(
			STARTUP_NOTIFICATION_HAS_NOTIFICATION_SESSION_STORAGE_KEY,
		);

	const createNotification = async () => {
		const authenticatedUser = await getCurrentAuthenticatedUser().catch(() => {});

		await chrome.notifications.create(
			`${STARTUP_NOTIFICATION_NOTIFICATION_PREFIX}${authenticatedUser?.id ?? "null"}`,
			{
				type: "basic",
				iconUrl: browser.runtime.getURL("img/icon/128.png"),
				title: getMessage("notifications.startup.title"),
				message: authenticatedUser
					? getMessage("notifications.startup.message", {
							displayName: authenticatedUser.displayName,
						})
					: getMessage("notifications.startup.message.notAuthenticated"),
				contextMessage: getMessage("notifications.startup.context"),
				eventTime: Date.now() + 1_000 * 10,
			},
		);

		await setExtensionSessionStorage({
			[STARTUP_NOTIFICATION_HAS_NOTIFICATION_SESSION_STORAGE_KEY]: true,
		});
	};

	const onTabCreated = async (tab: chrome.tabs.Tab | chrome.tabs.OnUpdatedInfo) => {
		if (!tab.url) return;

		const url = new URL(tab.url);
		if (url.hostname.endsWith(getRobloxUrl(""))) {
			if (!(await checkHasGotNotification())) {
				await createNotification();
			}

			onEnd();
		}
	};

	const onTabUpdated = (_: number, info: chrome.tabs.OnUpdatedInfo) => onTabCreated(info);
	const onEnd = () => {
		browser.tabs.onUpdated.removeListener(onTabUpdated);
		browser.tabs.onCreated.removeListener(onTabCreated);
	};

	checkHasGotNotification().then((checkedRoblox) => {
		if (checkedRoblox) {
			onEnd();
		} else {
			if (value[1] === "onVisit") {
				browser.tabs.onUpdated.addListener(onTabUpdated);
				browser.tabs.onCreated.addListener(onTabCreated);
			} else if (value[1] === "onOpen") {
				createNotification();
			}
		}
	});

	return onEnd;
});

/*
UNUSED: Background settings sync. Not enabled because of sync storage limits per key
export default {
	action: SYNC_DATA_ALARM_NAME,
	featureIds: [SYNC_ROSEAL_SETTINGS_FEATURE_ID],
	fn: async () => {
		const localData = await storage.get([
			EXTENSION_INSTALLATION_ID_STORAGE_KEY,
			...MAIN_STORAGE_KEYS_SYNC,
		]);

		let installationId = localData[EXTENSION_INSTALLATION_ID_STORAGE_KEY];
		if (!installationId) {
			installationId = crypto.randomUUID();
			await storage.set({
				[EXTENSION_INSTALLATION_ID_STORAGE_KEY]: installationId,
			});
		}

		delete localData[EXTENSION_INSTALLATION_ID_STORAGE_KEY];

		await chrome.storage.sync.set({
			[SYNC_DATA_LOCAL_STORAGE_KEY]: {
				installationId,
				time: Math.floor(Date.now() / 1_000),
				data: localData,
			},
		});
	},
} satisfies BackgroundAlarmListener;


browser.runtime.onStartup.addListener(() =>
	featureValueIs(SYNC_ROSEAL_SETTINGS_FEATURE_ID, true, async () => {
		const remoteSyncData: SyncDataSyncStorageValue | undefined = (
			await browser.storage.sync?.get(SYNC_DATA_SYNC_STORAGE_KEY)
		)?.[SYNC_DATA_SYNC_STORAGE_KEY];
		if (!remoteSyncData) return;
		const localData = await storage.get([
			SYNC_DATA_LOCAL_STORAGE_KEY,
			EXTENSION_INSTALLATION_ID_STORAGE_KEY,
		]);

		let installationId = localData[EXTENSION_INSTALLATION_ID_STORAGE_KEY];
		if (!installationId) {
			installationId = crypto.randomUUID();
			await storage.set({
				[EXTENSION_INSTALLATION_ID_STORAGE_KEY]: installationId,
			});
		}
		const localSyncData: SyncDataLocalStorageValue = localData[SYNC_DATA_LOCAL_STORAGE_KEY] ?? {
			time: 0,
		};
		if (
			localSyncData.time >= remoteSyncData.time ||
			!remoteSyncData.installationId === installationId
		)
			return;

		const newDataToSet: Record<string, unknown> = {};
		for (const key in remoteSyncData.data) {
			if (MAIN_STORAGE_KEYS_SYNC.includes(key)) {
				newDataToSet[key] = remoteSyncData.data[key];
			}
		}

		await storage.set({
			[SYNC_DATA_LOCAL_STORAGE_KEY]: {
				time: Math.floor(Date.now() / 1_000),
			},
			...newDataToSet,
		});
	}),
);

featureValueIsLater(SYNC_ROSEAL_SETTINGS_FEATURE_ID, true, async () => {
	if (!(await browser.alarms.get(SYNC_DATA_ALARM_NAME))) {
		await browser.alarms.create(SYNC_DATA_ALARM_NAME, {
			periodInMinutes: 5,
		});
	}
	return () => browser.alarms.clear(SYNC_DATA_ALARM_NAME);
});
*/
