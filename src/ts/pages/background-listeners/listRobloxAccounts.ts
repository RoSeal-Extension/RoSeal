import {
	ACCOUNTS_FEATURE_ID,
	ACCOUNTS_RULES_SESSION_CACHE_STORAGE_KEY,
	type AccountsRulesStorageValue,
} from "src/ts/constants/accountsManager";
import { hasCookiesPermissions, listRobloxAccounts } from "src/ts/utils/background/cookies";
import type { BackgroundMessageListener } from "src/types/dataTypes";

export default {
	action: "listRobloxAccounts",
	featureIds: [ACCOUNTS_FEATURE_ID],
	fn: async () => {
		if (!(await hasCookiesPermissions())) {
			throw "NoPermissions";
		}

		const tokens = await browser.storage.session
			.get(ACCOUNTS_RULES_SESSION_CACHE_STORAGE_KEY)
			.then(
				(data) =>
					(data[ACCOUNTS_RULES_SESSION_CACHE_STORAGE_KEY] as AccountsRulesStorageValue) ??
					{},
			);

		return listRobloxAccounts().then((data) =>
			data.map((item) => ({
				userId: item.userId,
				token: tokens[item.userId]?.token,
			})),
		);
	},
} satisfies BackgroundMessageListener;
