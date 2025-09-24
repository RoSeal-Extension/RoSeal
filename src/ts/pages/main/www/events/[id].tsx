import EventViewThumbnailAsset from "src/ts/components/experience/events/ViewThumbnailAsset";
import ItemUpdatedCreated from "src/ts/components/item/UpdatedCreated";
import { watch } from "src/ts/helpers/elements";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import { modifyItemStats } from "src/ts/helpers/modifyItemStats";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { renderMentions } from "src/ts/utils/description";
import { EXPERIENCE_EVENT_REGEX } from "src/ts/utils/regex";
import { renderAfter } from "src/ts/utils/render";

export default {
	id: "experienceEvent.details",
	regex: [EXPERIENCE_EVENT_REGEX],
	css: ["css/experienceEvent.css"],
	fn: ({ regexMatches }) => {
		const id = regexMatches![0]![1]!;

		featureValueIs("viewItemMedia", true, () =>
			watch(".carousel-item-active", (el) => {
				renderAfter(<EventViewThumbnailAsset eventId={id} />, el);
			}),
		);

		featureValueIs("experienceEventsUpdatedCreated", true, () =>
			modifyItemStats(
				"ExperienceEvent",
				<ItemUpdatedCreated
					itemType="ExperienceEvent"
					itemId={id as unknown as number}
					target="experiences"
				/>,
			),
		);

		featureValueIs("formatItemMentions", true, () =>
			watch(".event-description-container > p", (el) => renderMentions(el)),
		);
	},
} satisfies Page;
