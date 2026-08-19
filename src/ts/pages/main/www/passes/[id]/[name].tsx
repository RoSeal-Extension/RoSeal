import ItemSales from "src/ts/components/avatarItem/Sales";
import ItemProductInfo from "src/ts/components/item/ProductInfo";
import ViewIconAssetButton from "src/ts/components/item/ViewIconAssetButton";
import { modifyItemContextMenu } from "src/ts/helpers/contextMenus";
import { watch, watchBeforeLoad } from "src/ts/helpers/elements";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import { modifyItemStats } from "src/ts/helpers/modifyItemStats";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getPlaceUniverseId } from "src/ts/helpers/requests/services/places";
import { handleItemTimes } from "src/ts/specials/times";
import { renderMentions } from "src/ts/utils/description";
import { EXPERIENCE_DETAILS_REGEX, PASS_DETAILS_REGEX } from "src/ts/utils/regex";
import { getPathFromMaybeUrl } from "src/ts/utils/url";

export default {
	id: "pass",
	regex: [PASS_DETAILS_REGEX],
	fn: ({ regexMatches }) => {
		const passId = Number.parseInt(regexMatches![0]?.[1], 10);

		featureValueIs("viewItemSales", true, async () => {
			const href = (
				await watchBeforeLoad<HTMLAnchorElement>(".related-asset-container a.text-name")
			)?.href;

			if (!href) {
				return;
			}

			const link = getPathFromMaybeUrl(href);
			if (!link) {
				return;
			}

			const parsedPlaceId = EXPERIENCE_DETAILS_REGEX.exec(link.realPath)?.[1];
			if (!parsedPlaceId) {
				return;
			}

			const placeId = Number.parseInt(parsedPlaceId, 10);
			const universeId = await getPlaceUniverseId({
				placeId,
			});

			if (!universeId) {
				return;
			}

			return modifyItemStats(
				"Item",
				() => (
					<ItemSales
						itemId={passId}
						itemType="GamePass"
						isAvatarItem={false}
						universeId={universeId}
					/>
				),
				1,
			);
		});

		featureValueIs("formatItemMentions", true, () =>
			watch(".description-content", (el) => renderMentions(el)),
		);

		handleItemTimes({
			itemType: "GamePass",
			itemId: passId,
			target: "associatedItems",
		});

		featureValueIs("viewItemProductInfo", true, () =>
			modifyItemStats(
				"Item",
				() => (
					<ItemProductInfo itemId={passId} itemType={"GamePass"} isAvatarItem={false} />
				),
				2,
			),
		);

		featureValueIs("viewItemMedia", true, () =>
			modifyItemContextMenu(<ViewIconAssetButton itemType="GamePass" itemId={passId} />),
		);
	},
} satisfies Page;
