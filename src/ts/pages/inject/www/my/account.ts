import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackRequest } from "src/ts/helpers/hijack/fetch";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { MY_ACCOUNT_REGEX } from "src/ts/utils/regex";

export default {
	id: "myAccount",
	regex: [MY_ACCOUNT_REGEX],
	fn: () => {
		featureValueIsInject("betterPrivateServersSubscriptions", true, () => {
			hijackRequest((req) => {
				const url = new URL(req.url);
				if (url.hostname === getRobloxUrl("games")) {
					if (url.pathname === "/v1/private-servers/my-private-servers") {
						return new Response(
							JSON.stringify({
								data: [],
							}),
							{
								headers: {
									"content-type": "application/json",
								},
							},
						);
					}
				}
			});
		});
	},
} satisfies Page;
