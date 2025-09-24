import { render } from "preact";
import DeveloperProductContainer from "src/ts/components/pages/DeveloperProductDetails";
import { watchOnce } from "src/ts/helpers/elements";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { isAuthenticated } from "src/ts/utils/authenticatedUser";
import { getRobloxCDNUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { getLoginLink } from "src/ts/utils/links";
import { DEVELOPER_PRODUCT_DETAILS_REGEX } from "src/ts/utils/regex";

export default {
	id: "developerProduct.details",
	regex: [DEVELOPER_PRODUCT_DETAILS_REGEX],
	isCustomPage: true,
	featureIds: ["viewExperienceDeveloperProducts"],
	css: [
		`https://${getRobloxCDNUrl("static", "/CSS/Pages/Item/ItemPage.css")}`,
		`https://${getRobloxCDNUrl("static", "/CSS/Pages/Shared/ItemThumbnail.css")}`,
		`https://${getRobloxCDNUrl("static", "/CSS/Pages/Shared/RelatedAssetOverlay.css")}`,
		"css/developerProduct.css",
	],

	fn: async ({ regexMatches }) => {
		const id = Number.parseInt(regexMatches![0][1], 10);

		if (!(await isAuthenticated())) {
			window.location.href = getLoginLink();
			return;
		}

		watchOnce(".content").then((content) =>
			render(<DeveloperProductContainer developerProductId={id} />, content),
		);
	},
} satisfies Page;
