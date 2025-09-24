import { ACCOUNTS_FEATURE_ID } from "src/ts/constants/accountsManager";
import { invokeMessage } from "src/ts/helpers/communication/main";
import {
	getCurrentCookies,
	hasCookiesPermissions,
	listRobloxAccounts,
	setCurrentCookies,
	updateRobloxAccounts,
} from "src/ts/utils/background/cookies";
import type { BackgroundMessageListener } from "src/types/dataTypes";

export default {
	action: "removeRobloxAccount",
	featureIds: [ACCOUNTS_FEATURE_ID],
	fn: async ({ userId }, sender) => {
		if (!sender?.tab?.id) {
			throw "UnknownError";
		}
		if (!(await hasCookiesPermissions())) {
			throw "NoPermissions";
		}

		const accounts = await listRobloxAccounts();
		const account = accounts.find((account) => account.userId === userId);
		if (!account) {
			throw "AccountNotFound";
		}
		const currentCookies = await getCurrentCookies();
		await setCurrentCookies(account.cookies);

		const endpointResponse = await invokeMessage(
			sender.tab.id,
			"logoutRobloxAccount",
			undefined,
		);
		if (endpointResponse) {
			await updateRobloxAccounts(accounts.filter((account) => account.userId !== userId));
		}

		await setCurrentCookies(currentCookies);
	},
} satisfies BackgroundMessageListener<"removeRobloxAccount">;
