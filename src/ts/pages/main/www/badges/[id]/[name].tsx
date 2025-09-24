import BadgeAwardedStats from "src/ts/components/badges/AwardedStats";
import ViewIconAssetButton from "src/ts/components/item/ViewIconAssetButton";
import { modifyItemContextMenu } from "src/ts/helpers/contextMenus";
import { watch } from "src/ts/helpers/elements";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import { modifyItemStats } from "src/ts/helpers/modifyItemStats";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { handleItemTimes } from "src/ts/specials/times";
import { renderMentions } from "src/ts/utils/description";
import { BADGE_DETAILS_REGEX } from "src/ts/utils/regex";

export default {
	id: "badge",
	regex: [BADGE_DETAILS_REGEX],
	css: ["css/badgeDetails.css"],
	fn: ({ regexMatches }) => {
		const badgeId = Number.parseInt(regexMatches![0]?.[1], 10);

		handleItemTimes({
			itemType: "Badge",
			itemId: badgeId,
			target: "associatedItems",
		});

		featureValueIs("formatItemMentions", true, () =>
			watch(".description-content", (el) => renderMentions(el)),
		);

		featureValueIs("badgeAwardedStats", true, () =>
			modifyItemStats("Item", <BadgeAwardedStats badgeId={badgeId} />, -1),
		);

		featureValueIs("viewItemMedia", true, () =>
			modifyItemContextMenu(<ViewIconAssetButton itemType="Badge" itemId={badgeId} />),
		);
	},
} satisfies Page;
