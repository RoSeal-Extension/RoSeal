import { render } from "preact";
import HiddenAvatarBundleContainer from "src/ts/components/pages/HiddenAvatarBundleDetails";
import { watchOnce } from "src/ts/helpers/elements";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { HIDDEN_AVATAR_BUNDLE_DETAILS_REGEX } from "src/ts/utils/regex";

export default {
	id: "hiddenAvatarBundle.details",
	regex: [HIDDEN_AVATAR_BUNDLE_DETAILS_REGEX],
	css: ["css/hiddenAvatarBundle.css"],
	isCustomPage: true,
	featureIds: ["viewHiddenAvatarItems"],
	fn: async ({ regexMatches }) => {
		const id = Number.parseInt(regexMatches![0][2], 10);

		watchOnce(".content").then((content) =>
			render(<HiddenAvatarBundleContainer bundleId={id} />, content),
		);
	},
} satisfies Page;
