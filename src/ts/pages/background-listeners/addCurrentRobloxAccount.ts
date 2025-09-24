import { ACCOUNTS_FEATURE_ID, ROBLOX_ACCOUNT_LIMIT } from "src/ts/constants/accountsManager";
import {
	getCurrentCookies,
	hasCookiesPermissions,
	listRobloxAccounts,
	updateRobloxAccounts,
} from "src/ts/utils/background/cookies";
import type { BackgroundMessageListener } from "src/types/dataTypes";

export default {
	action: "addCurrentRobloxAccount",
	featureIds: [ACCOUNTS_FEATURE_ID],
	fn: async ({ userId }, sender) => {
		if (!(await hasCookiesPermissions())) {
			throw "NoPermissions";
		}

		const accounts = await listRobloxAccounts();

		let updatingExistingAccount = false;
		// @ts-expect-error: cookieStoreId is not in the type
		const cookies = await getCurrentCookies(sender?.tab?.cookieStoreId);
		for (const account of accounts) {
			if (account.userId === userId) {
				updatingExistingAccount = true;
				account.cookies = cookies;
			}
		}

		if (!updatingExistingAccount) {
			if (accounts.length >= ROBLOX_ACCOUNT_LIMIT) {
				throw "MaxAccounts";
			}

			accounts.push({
				userId,
				cookies,
			});
		}
		await updateRobloxAccounts(accounts);
	},
} satisfies BackgroundMessageListener<"addCurrentRobloxAccount">;
