import {
	TRADE_STATUS_FILTERS,
	TRADING_NOTIFICATIONS_ALARM_NAME,
	TRADING_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	TRADING_NOTIFICATIONS_NOTIFICATION_PREFIX,
	TRADING_NOTIFICATIONS_STORAGE_DEFAULT_VALUE,
	TRADING_NOTIFICATIONS_STORAGE_KEY,
	type TradingNotificationsStorageValue,
} from "src/ts/constants/trades";
import { invokeMessage } from "src/ts/helpers/communication/background";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { backgroundLocalesLoaded } from "src/ts/helpers/i18n/locales";
import { getCurrentAuthenticatedUser } from "src/ts/helpers/requests/services/account";
import { getTradeById, listTrades } from "src/ts/helpers/requests/services/trades";
import { storage } from "src/ts/helpers/storage";
import { getRoSealNotificationIcon } from "src/ts/utils/background/notifications";
import type { BackgroundAlarmListener } from "src/types/dataTypes";

export async function fetchTradesAndUpdateData() {
	try {
		await backgroundLocalesLoaded;

		const storageValue = ((await storage.get(TRADING_NOTIFICATIONS_STORAGE_KEY))?.[
			TRADING_NOTIFICATIONS_STORAGE_KEY
		] ?? TRADING_NOTIFICATIONS_STORAGE_DEFAULT_VALUE) as TradingNotificationsStorageValue;

		const notifications: [string, chrome.notifications.NotificationCreateOptions][] = [];
		const authenticatedUserPromise = getCurrentAuthenticatedUser();

		await Promise.all(
			TRADE_STATUS_FILTERS.map((tradeStatusType) =>
				listTrades({
					tradeStatusType,
					limit: 25,
					sortOrder: "Desc",
				}).then(async (data) => {
					const authenticatedUser = await authenticatedUserPromise;

					const promises: Promise<void>[] = [];
					for (const item of data.data) {
						const oldStatus = storageValue.trades[item.id];

						const isDone = item.status !== "Open" && item.status !== "Pending";
						if (isDone) {
							delete storageValue.trades[item.id];
						}

						if (oldStatus !== item.status && (oldStatus || !isDone)) {
							if (!isDone) storageValue.trades[item.id] = item.status;

							if (storageValue.usersLastChecked[authenticatedUser.id]) {
								promises.push(
									getTradeById({
										tradeId: item.id,
									}).then(async (trade) => {
										const myOffer = trade.participantAOffer;
										const theirOffer = trade.participantBOffer;

										let myOfferRAP = 0;
										let theirOfferRAP = 0;

										for (const item of myOffer.items) {
											myOfferRAP += item.recentAveragePrice;
										}

										for (const item of theirOffer.items) {
											theirOfferRAP += item.recentAveragePrice;
										}

										notifications.push([
											`${TRADING_NOTIFICATIONS_NOTIFICATION_PREFIX}${tradeStatusType}:${item.id}`,
											{
												type: "list",
												iconUrl: await getRoSealNotificationIcon({
													type: "AvatarHeadShot",
													targetId: item.user.id,
													size: "420x420",
												}),
												title: getMessage(
													`notifications.trades.title.${item.status}`,
												),
												message: getMessage(
													"notifications.trades.message",
													{
														displayName: item.user.name,
													},
												),
												items: [
													{
														title: getMessage(
															"notifications.trades.items.partner",
														),
														message: item.user.displayName,
													},
													{
														title: getMessage(
															"notifications.trades.items.myRAP",
														),
														message: getMessage(
															"notifications.trades.items.value",
															{
																rap: asLocaleString(myOfferRAP),
																hasRobux: myOffer.robux !== 0,
																robux: asLocaleString(
																	myOffer.robux,
																),
															},
														),
													},
													{
														title: getMessage(
															"notifications.trades.items.theirRAP",
														),
														message: getMessage(
															"notifications.trades.items.value",
															{
																rap: asLocaleString(theirOfferRAP),
																hasRobux: theirOffer.robux !== 0,
																robux: asLocaleString(
																	theirOffer.robux,
																),
															},
														),
													},
												],
												contextMessage: getMessage(
													"notifications.trades.context",
												),
												isClickable: true,
											},
										]);
									}),
								);
							}
						}
					}

					return Promise.all(promises);
				}),
			),
		);

		for (const notification of notifications) {
			if (import.meta.env.ENV === "background") {
				await browser.notifications.create(notification[0], notification[1]);
			} else {
				await invokeMessage("createNotification", {
					id: notification[0],
					notification: notification[1],
				});
			}
		}

		storageValue.usersLastChecked[(await authenticatedUserPromise).id] = Math.floor(
			Date.now() / 1_000,
		);

		storage.set({
			[TRADING_NOTIFICATIONS_STORAGE_KEY]: storageValue,
		});
	} catch {}
}

export default {
	action: TRADING_NOTIFICATIONS_ALARM_NAME,
	featureIds: [TRADING_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID],
	fn: fetchTradesAndUpdateData,
} satisfies BackgroundAlarmListener;
