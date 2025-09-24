import { ACCOUNTS_FEATURE_ID } from "src/ts/constants/accountsManager";
import {
	hasCookiesPermissions,
	listRobloxAccounts,
	setCurrentCookies,
} from "src/ts/utils/background/cookies";
import type { BackgroundMessageListener } from "src/types/dataTypes";

export default {
	action: "switchRobloxAccount",
	featureIds: [ACCOUNTS_FEATURE_ID],
	fn: async ({ userId }) => {
		if (!(await hasCookiesPermissions())) {
			throw "NoPermissions";
		}

		const accounts = await listRobloxAccounts();
		const account = accounts.find((account) => account.userId === userId);
		if (!account) {
			throw "InvalidAccount";
		}
		return setCurrentCookies(account.cookies);
	},
} satisfies BackgroundMessageListener<"switchRobloxAccount">;
