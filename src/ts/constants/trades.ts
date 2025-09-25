import type { TradeStatus, TradeStatusFilter } from "../helpers/requests/services/trades";

export const TRADING_NOTIFICATIONS_ALARM_NAME = "tradesCheck";
export const TRADING_NOTIFICATIONS_FEATURE_ID = "tradeNotifications";
export const TRADING_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID =
	"tradeNotifications.backgroundChecks";
export const TRADING_NOTIFICATIONS_STORAGE_KEY = "recentTrades";
export const TRADING_NOTIFICATIONS_NOTIFICATION_PREFIX = "tradeUpdate:";
export const TRADING_NOTIFICATIONS_FETCHED_SESSION_CACHE_STORAGE_KEY = "cache.tradesCheck";

export const TRADE_STATUS_FILTERS = [
	"Inbound",
	"Outbound",
	"Inactive",
	"Completed",
] satisfies TradeStatusFilter[];

export type TradingNotificationsStorageValue = {
	usersLastChecked: Record<string, number>;
	trades: Record<string, TradeStatus>;
};
export const TRADING_NOTIFICATIONS_STORAGE_DEFAULT_VALUE = {
	usersLastChecked: {},
	trades: {},
} as TradingNotificationsStorageValue;
