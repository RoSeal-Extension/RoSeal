import { ACCOUNTS_FEATURE_ID } from "src/ts/constants/accountsManager";
import {
	hasCookiesPermissions,
	listRobloxAccounts,
	updateRobloxAccounts,
} from "src/ts/utils/background/cookies";
import { crossSort } from "src/ts/utils/objects";
import type { BackgroundMessageListener } from "src/types/dataTypes";

export default {
	action: "sortRobloxAccounts",
	featureIds: [ACCOUNTS_FEATURE_ID],
	fn: async (list) => {
		if (!(await hasCookiesPermissions())) {
			throw "NoPermissions";
		}

		const accounts = await listRobloxAccounts();

		await updateRobloxAccounts(
			crossSort(accounts, (a, b) => {
				const aPosition = list.findIndex((item) => item.userId === a.userId);
				const bPosition = list.findIndex((item) => item.userId === b.userId);

				if (aPosition < 0 || bPosition < 0) {
					return 0;
				}

				if (aPosition > bPosition) {
					return 1;
				}
				if (aPosition < bPosition) {
					return -1;
				}

				return 0;
			}),
		);
	},
} satisfies BackgroundMessageListener<"sortRobloxAccounts">;
