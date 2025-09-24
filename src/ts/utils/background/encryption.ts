import { ENCRYPTION_KEY_ALG, ENCRYPTION_KEY_NAME } from "src/ts/constants/accountsManager";
import localForage from "localforage";

export function createEncryptionKey() {
	return crypto.subtle.generateKey(ENCRYPTION_KEY_ALG, false, ["encrypt", "decrypt"]);
}

export function getEncryptionKey() {
	return localForage.getItem<CryptoKey>(ENCRYPTION_KEY_NAME).then((key) => {
		if (key) return key;

		return createEncryptionKey().then((key) => {
			localForage.setItem(ENCRYPTION_KEY_NAME, key);
			return key;
		});
	});
}

export function removeEncryptionKey() {
	return localForage.removeItem(ENCRYPTION_KEY_NAME);
}

export async function decrypt(dataBuffer: BufferSource, iv: BufferSource) {
	const key = await getEncryptionKey();

	return new Uint8Array(
		await crypto.subtle.decrypt(
			{
				...ENCRYPTION_KEY_ALG,
				iv,
			},
			key,
			dataBuffer,
		),
	);
}

export async function encrypt(dataBuffer: BufferSource) {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const key = await getEncryptionKey();

	const dataBufferEncrypted = new Uint8Array(
		await crypto.subtle.encrypt(
			{
				...ENCRYPTION_KEY_ALG,
				iv,
			},
			key,
			dataBuffer,
		),
	);

	return {
		dataBufferEncrypted,
		iv,
	};
}
