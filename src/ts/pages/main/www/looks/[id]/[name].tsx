import ItemUpdatedCreated from "src/ts/components/item/UpdatedCreated";
import CopyShareLinkButton from "src/ts/components/misc/CopyShareLinkButton";
import { modifyItemContextMenu } from "src/ts/helpers/contextMenus";
import { watch } from "src/ts/helpers/elements";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import { modifyItemStats } from "src/ts/helpers/modifyItemStats";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { renderMentions } from "src/ts/utils/description";
import { LOOK_REGEX } from "src/ts/utils/regex";

export default {
	id: "looks.details",
	regex: [LOOK_REGEX],
	fn: ({ regexMatches }) => {
		const id = regexMatches![0]![1]!;

		featureValueIs("copyShareLinks", true, () =>
			modifyItemContextMenu(<CopyShareLinkButton type="Look" id={id as unknown as number} />),
		);

		featureValueIs("formatItemMentions", true, () =>
			watch("#item-details-description > div", renderMentions),
		);

		featureValueIs("avatarItemCreatedUpdated", true, () =>
			modifyItemStats(
				"Look",
				<ItemUpdatedCreated
					itemType="Look"
					itemId={id as unknown as number}
					target="avatarItems"
				/>,
			),
		);
	},
} satisfies Page;
