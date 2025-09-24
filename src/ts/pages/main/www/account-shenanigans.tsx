import AccountShenanigansContainer from "src/ts/components/pages/AccountShenanigans";
import { modifyTitle, watchOnce } from "src/ts/helpers/elements";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { ACCOUNT_SHENANIGANS_REGEX } from "src/ts/utils/regex";
import { renderAppend } from "src/ts/utils/render";

export default {
	id: "accountShenanigans",
	regex: [ACCOUNT_SHENANIGANS_REGEX],
	isCustomPage: true,
	css: ["css/accountShenanigans.css"],
	fn: () => {
		modifyTitle("Account Shenanigans");
		watchOnce(".content").then((content) =>
			renderAppend(<AccountShenanigansContainer />, content),
		);
	},
} satisfies Page;
