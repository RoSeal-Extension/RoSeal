import UsernamePreviewContainer from "src/ts/components/users/UsernamePreviewContainer";
import { watch } from "src/ts/helpers/elements";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { ACCOUNT_SIGNUP_REGEX } from "src/ts/utils/regex";
import { renderAfter } from "src/ts/utils/render";

export default {
	id: "accountSignup",
	regex: [ACCOUNT_SIGNUP_REGEX],
	css: ["css/accountShenanigans.css"],
	fn: () => {
		featureValueIs("showExperienceChatUsernameColor", true, () =>
			watch<HTMLInputElement>("#signup-username", (signupField) => {
				const el = signupField.classList.contains("width-full")
					? signupField.parentElement!
					: signupField;

				renderAfter(<UsernamePreviewContainer el={signupField} />, el);
			}),
		);
	},
} satisfies Page;
