import { ACCOUNTS_FEATURE_ID } from "src/ts/constants/accountsManager";
import { hasCookiesPermissions, setCurrentCookies } from "src/ts/utils/background/cookies";
import type { BackgroundMessageListener } from "src/types/dataTypes";

export default {
	action: "logoutRobloxSession",
	featureIds: [ACCOUNTS_FEATURE_ID],
	fn: async () => {
		if (!(await hasCookiesPermissions())) {
			throw "NoPermissions";
		}

		await setCurrentCookies(null);
	},
} satisfies BackgroundMessageListener<"logoutRobloxSession">;
