export const ACCOUNT_TRACKING_PREVENTION_FEATURE_ID = "accountTrackingPrevention";
export const ACCOUNT_TRACKING_PREVENTION_STORAGE_KEY = "accountTrackingPrevention";
export const ACCOUNT_TRACKING_PREVENTION_PRESENCE_UPDATE_ALARM_NAME =
	"accountTrackingPrevention.presenceUpdate";

export type AccountTrackingPreventionAccount = {
	rapidAvatarUpdate: {
		enabled: boolean;
	};
	onlineStatus: {
		enabled: boolean;
		type: "studio" | "online";
		studioPlaceIds?: number[];
	};
};

export type AccountTrackingPreventionStorageValue = {
	accounts: Record<number, AccountTrackingPreventionAccount>;
};
