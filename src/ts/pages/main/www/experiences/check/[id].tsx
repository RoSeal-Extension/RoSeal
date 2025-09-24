import { watchOnce } from "src/ts/helpers/elements";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { PLACE_CHECK_REGEX } from "src/ts/utils/regex";
import { renderIn } from "src/ts/utils/render";
import ExperienceRestrictedScreen from "src/ts/components/experience/RestrictedScreen";

export default {
	id: "experience.check",
	regex: [PLACE_CHECK_REGEX],
	isCustomPage: true,
	css: ["css/experienceCheck.css"],
	featureIds: ["experienceRestrictedScreen"],
	fn: ({ regexMatches }) => {
		const idStr = regexMatches?.[0]?.[1];
		if (!idStr) {
			return;
		}

		const id = Number.parseInt(idStr, 10);
		watchOnce(".content").then((content) =>
			renderIn(<ExperienceRestrictedScreen placeId={id} />, content),
		);
	},
} satisfies Page;
