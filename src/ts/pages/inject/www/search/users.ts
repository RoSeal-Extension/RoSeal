import { getFeatureValueInject } from "src/ts/helpers/features/helpersInject";
import { hijackRequest } from "src/ts/helpers/hijack/fetch";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { SEARCH_USERS_REGEX } from "src/ts/utils/regex";

export default {
	id: "users.search",
	regex: [SEARCH_USERS_REGEX],
	fn: () => {
		getFeatureValueInject("userOmniSearchOverridePageLimit").then((value) => {
			if (!value?.[0]) return;

			hijackRequest((req) => {
				const url = new URL(req.url);
				if (
					url.hostname === getRobloxUrl("apis") &&
					url.pathname === "/search-api/omni-search"
				) {
					if (!url.searchParams.get("pageToken")) {
						url.searchParams.set(
							"pageToken",
							btoa(JSON.stringify({ start: 0, count: value[1], endOfPage: false })),
						);

						return new Request(url.toString(), req);
					}
				}

				return req;
			});
		});
	},
} as Page;
