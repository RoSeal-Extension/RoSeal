import { render } from "preact";
import AvatarAssetContainer from "src/ts/components/pages/AvatarAssetDetails";
import { watchOnce } from "src/ts/helpers/elements";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getAvatarItemPageData } from "src/ts/helpers/requests/services/misc";
import { HIDDEN_AVATAR_ASSET_DETAILS_REGEX } from "src/ts/utils/regex";

/*
	injectScripts: [
		{
			document: getAvatarItemPageData({}),
			selectors: [["ItemDetailsThumbnail"].map((item) => `[data-bundlename*="${item}"]`)],
		},
	],
					watchOnce(".item-thumbnail-container").then((el) => {
					el.classList.remove("item-thumbnail-container");
					el.replaceChildren();
					el.id = "item-thumbnail-container-frontend";
					el.dataset.targetId = itemId.value.toString();
					el.dataset.isBundle = itemType.value === "Bundle" ? "True" : "False";
					el.dataset.isAnimationBundle = "True";
				});
				watchBeforeLoad(".bundle-animation-btn-container").then((el) => el?.remove());
*/

export default {
	id: "hiddenAvatarAsset.details",
	regex: [HIDDEN_AVATAR_ASSET_DETAILS_REGEX],
	css: ["css/item.css"],
	isCustomPage: true,
	featureIds: ["viewHiddenAvatarItems"],
	injectScripts: [
		{
			document: () => getAvatarItemPageData({}),
			selectors: [
				[
					'script[data-bundlename="Thumbnails3d"]',
					'link[href][rel="stylesheet"]:not(link[href="/catalog"])',
				],
			],
			dependent: true,
		},
	],
	fn: async ({ regexMatches }) => {
		const id = Number.parseInt(regexMatches![0][2], 10);
		watchOnce(".content").then((content) =>
			render(<AvatarAssetContainer assetId={id} />, content),
		);
	},
} satisfies Page;
