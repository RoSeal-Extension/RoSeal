import { render } from "preact";
import Page404 from "src/ts/components/core/errors/404";
import Loading from "src/ts/components/core/Loading.tsx";
import { watchOnce } from "src/ts/helpers/elements";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { multigetUniversesByIds } from "src/ts/helpers/requests/services/universes.ts";
import { getExperienceLink } from "src/ts/utils/links.ts";
import { UNIVERSE_REDIRECT_REGEX } from "src/ts/utils/regex";

export default {
	id: "experiences.universeRedirect",
	regex: [UNIVERSE_REDIRECT_REGEX],
	featureIds: ["experiencesUniverseRedirect"],
	isCustomPage: true,
	fn: ({ regexMatches }) => {
		multigetUniversesByIds({ universeIds: [Number.parseInt(regexMatches![0][2], 10)] })
			.then(([universe]) => {
				location.href = getExperienceLink(universe.rootPlaceId, universe.name);
			})
			.catch(() => {
				watchOnce(".content").then((el) => render(<Page404 />, el));
			});

		watchOnce(".content").then((el) => render(<Loading />, el));
	},
} satisfies Page;
