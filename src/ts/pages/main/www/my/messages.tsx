import { signal } from "@preact/signals";
import R2EButtons from "src/ts/components/messages/R2EButtons";
import { watch } from "src/ts/helpers/elements";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import { MY_MESSAGES_REGEX } from "src/ts/utils/regex";
import { renderAfter } from "src/ts/utils/render";

export default {
	id: "messages",
	regex: [MY_MESSAGES_REGEX],
	fn: () => {
		featureValueIs("getUnreadR2EButton", true, () => {
			const state = signal({
				pending: false,
				downloadString: undefined,
				hasError: false,
				messageIds: [],
			});

			watch(".roblox-markAsUnreadInbox", (el) => {
				if (el.nextElementSibling) return;

				renderAfter(<R2EButtons state={state} />, el);
			});
		});
	},
};
