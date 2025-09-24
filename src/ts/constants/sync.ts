export const EXTENSION_INSTALLATION_ID_STORAGE_KEY = "installationId";
export const SYNC_DATA_LOCAL_STORAGE_KEY = "syncData";
export const SYNC_DATA_SYNC_STORAGE_KEY = "syncData";
export const SYNC_DATA_ALARM_NAME = "syncData";

export const SYNC_ROSEAL_SETTINGS_FEATURE_ID = "syncRoSealSettings";

export type SyncDataSyncStorageValue = {
	installationId: string;
	time: number;
	data: Record<string, unknown>;
};

export type SyncDataLocalStorageValue = {
	time: number;
};
