import {
	API_KEY_DESCRIPTION,
	API_KEY_ERROR_MESSAGES,
	API_KEY_PREFIX,
	API_KEY_SCOPE_OBJS,
	API_KEY_SCOPE_STR,
	API_KEYS_STORAGE_KEY,
	type APIKeysStorageValue,
} from "../constants/apiKey";
import { RESTError } from "../helpers/requests/main";
import {
	createAPIKey,
	getApiKey,
	regenerateAPIKey,
	updateAPIKey,
} from "../helpers/requests/services/account";
import { storage } from "../helpers/storage";

export function getAPIKeyParams() {
	return {
		name: `${API_KEY_PREFIX} ${crypto.randomUUID()}`,
		description: API_KEY_DESCRIPTION,
		isEnabled: true,
		allowedCidrs: ["0.0.0.0/0"],
		scopes: API_KEY_SCOPE_OBJS,
	};
}

export async function tryAPIKeyRequest<T>(
	userId: number,
	fn: (apiKey: string) => Promise<T>,
	forceRefresh?: boolean,
	forceCreate?: boolean,
): Promise<T> {
	const data = ((await storage.get([API_KEYS_STORAGE_KEY]))?.[API_KEYS_STORAGE_KEY] ??
		{}) as APIKeysStorageValue;

	const time = Math.floor(Date.now() / 1_000);
	let userData: APIKeysStorageValue[number] | undefined = data[userId];
	const expired = userData !== undefined && userData?.expiresAt <= time;

	if (!userData || forceRefresh || userData.scope !== API_KEY_SCOPE_STR || expired) {
		let shouldCreateNewKey = userData === undefined || forceCreate;

		if (!shouldCreateNewKey) {
			try {
				await updateAPIKey({
					cloudAuthId: userData.cloudAuthId,
					cloudAuthUserConfiguredProperties: getAPIKeyParams(),
				});

				const regeneratedKey = (
					await regenerateAPIKey({
						cloudAuthId: userData.cloudAuthId,
					})
				).apikeySecret;

				data[userId] = {
					cloudAuthId: userData.cloudAuthId,
					scope: API_KEY_SCOPE_STR,
					key: regeneratedKey,
					expiresAt: time + 60_000 * 60 * 24 * 3,
				};
				userData = data[userId];
				storage.set({
					[API_KEYS_STORAGE_KEY]: data,
				});
			} catch {
				shouldCreateNewKey = true;
			}
		}

		if (shouldCreateNewKey) {
			const newApiKey = await createAPIKey({
				cloudAuthUserConfiguredProperties: getAPIKeyParams(),
			});
			data[userId] = {
				cloudAuthId: newApiKey.cloudAuthInfo.id,
				scope: API_KEY_SCOPE_STR,
				key: newApiKey.apikeySecret,
				expiresAt: time + 60_000 * 60 * 24 * 3,
			};
			userData = data[userId];
			storage.set({
				[API_KEYS_STORAGE_KEY]: data,
			});
		}
	}

	try {
		return await fn(userData.key);
	} catch (err) {
		const message = err instanceof RESTError && err.errors?.[0].message;
		if (message && API_KEY_ERROR_MESSAGES.includes(message)) {
			try {
				await getApiKey({
					apiKey: userData.cloudAuthId,
				});

				// exists, try to refresh
				return tryAPIKeyRequest(userId, fn, true);
			} catch {
				return tryAPIKeyRequest(userId, fn, true, true);
			}
		}

		throw err;
	}
}
