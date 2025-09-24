import { ACCOUNT_TRACKING_PREVENTION_FEATURE_ID } from "src/ts/constants/accountTrackingPrevention";
import { handleAccountTrackingProtectionAccount } from "src/ts/utils/background/accountTrackingPrevention";
import type { BackgroundMessageListener } from "src/types/dataTypes";

export default {
	action: "checkAccountTrackingPrevention",
	featureIds: [ACCOUNT_TRACKING_PREVENTION_FEATURE_ID],
	fn: async (data) => {
		await handleAccountTrackingProtectionAccount(data.userId);
	},
} satisfies BackgroundMessageListener<"checkAccountTrackingPrevention">;
