import {
	type AccountCookie,
	ENCRYPTED_ACCOUNTS_STORAGE_KEY,
	FETCH_COOKIE_STORE_URL,
	LEGACY_MIZORE_ACCOUNTS_STORAGE_KEY,
	type LegacyMizoreAccount,
	ROBLOX_COOKIES,
	SET_COOKIE_STORE_DOMAIN,
	type StoredAccount,
	UNENCRYPTED_ACCOUNTS_STORAGE_KEY,
} from "src/ts/constants/accountsManager";
import { storage } from "src/ts/helpers/storage";
import { base64ToBytes } from "../hex";
import { decrypt, removeEncryptionKey } from "./encryption";

export async function decryptAccounts(
	dataBufferBase64: string,
	ivBase64: string,
): Promise<StoredAccount[]> {
	return JSON.parse(
		new TextDecoder().decode(
			await decrypt(base64ToBytes(dataBufferBase64), base64ToBytes(ivBase64)),
		),
	);
}

export async function listRobloxAccounts(): Promise<StoredAccount[]> {
	const allData = await storage.get([
		ENCRYPTED_ACCOUNTS_STORAGE_KEY,
		UNENCRYPTED_ACCOUNTS_STORAGE_KEY,
		LEGACY_MIZORE_ACCOUNTS_STORAGE_KEY,
	]);

	const legacyData = allData[LEGACY_MIZORE_ACCOUNTS_STORAGE_KEY] as
		| LegacyMizoreAccount[]
		| undefined;
	const encryptedData = allData[ENCRYPTED_ACCOUNTS_STORAGE_KEY] as [string, string] | undefined;
	const unencryptedData = allData[UNENCRYPTED_ACCOUNTS_STORAGE_KEY] as
		| StoredAccount[]
		| undefined;

	if (legacyData) {
		const idCookie = ROBLOX_COOKIES.find((cookie) => cookie.required)!;

		const newData = legacyData.map((account) => ({
			userId: account.userId,
			cookies: [
				{
					name: idCookie.name,
					expiration: account.securityCookieExpiration,
					value: account.securityCookie,
				},
			],
		}));

		return storage
			.remove(LEGACY_MIZORE_ACCOUNTS_STORAGE_KEY)
			.then(() => updateRobloxAccounts(newData))
			.then(() => newData);
	}

	if (encryptedData) {
		const [dataBase64, ivBase64] = encryptedData;
		try {
			const decrypted = await decryptAccounts(dataBase64, ivBase64);

			return updateRobloxAccounts(decrypted)
				.then(() => storage.remove(ENCRYPTED_ACCOUNTS_STORAGE_KEY))
				.then(removeEncryptionKey)
				.then(() => decrypted);
		} catch {
			return [];
		}
	}

	return unencryptedData || [];
}

export async function updateRobloxAccounts(data: StoredAccount[]) {
	try {
		await storage.set({
			[UNENCRYPTED_ACCOUNTS_STORAGE_KEY]: data,
		});
	} catch {}
}

export function hasCookiesPermissions() {
	return browser.permissions
		.contains({
			permissions: ["cookies"],
		})
		.then((value) => {
			if (!value) return false;

			return true;
		});
}

export async function getCurrentCookies(cookieStoreId?: string) {
	const cookies: AccountCookie[] = [];
	for (const cookieMetadata of ROBLOX_COOKIES) {
		const cookie = await browser.cookies.get({
			name: cookieMetadata.name,
			url: FETCH_COOKIE_STORE_URL,
			storeId: cookieStoreId,
		});

		if (!cookie && cookieMetadata.required) {
			throw "NoCookies";
		}

		if (cookie) {
			const value = cookieMetadata.prefix
				? cookie.value.replace(cookieMetadata.prefix, "")
				: cookie.value;

			cookies.push({
				name: cookieMetadata.name,
				value,
				expiration: cookie.expirationDate,
			});
		}
	}

	return cookies;
}

export async function setCurrentCookies(cookies: AccountCookie[] | null, cookieStoreId?: string) {
	if (cookies) {
		await Promise.all(
			cookies.map((cookie) => {
				const metadata = ROBLOX_COOKIES.find((cookie2) => cookie2.name === cookie.name);
				return browser.cookies.set({
					name: cookie.name,
					value: `${metadata?.prefix ?? ""}${cookie.value}`,
					expirationDate: cookie.expiration,
					httpOnly: metadata?.httpOnly,
					secure: metadata?.secure,
					url: FETCH_COOKIE_STORE_URL,
					domain: SET_COOKIE_STORE_DOMAIN,
					storeId: cookieStoreId,
				});
			}),
		);
	} else {
		await Promise.all(
			ROBLOX_COOKIES.map((cookie) =>
				browser.cookies.remove({
					name: cookie.name,
					url: FETCH_COOKIE_STORE_URL,
					storeId: cookieStoreId,
				}),
			),
		);
	}
}
