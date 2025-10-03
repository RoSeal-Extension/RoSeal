import { render } from "preact";
import UserPublishedAvatars from "src/ts/components/pages/UserPublishedAvatars";
import { modifyTitle, watchOnce } from "src/ts/helpers/elements";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { USER_AVATARS_REGEX } from "src/ts/utils/regex";

export default {
	id: "user.publishedAvatars",
	regex: [USER_AVATARS_REGEX],
	css: ["css/userPublishedAvatars.css"],
	isCustomPage: true,
	featureIds: ["viewUserPublishedAvatars"],
	fn: async ({ regexMatches }) => {
		const id = Number.parseInt(regexMatches![0][1], 10);
		modifyTitle("Published Avatars");

		watchOnce(".content").then((content) =>
			render(<UserPublishedAvatars userId={id} />, content),
		);
	},
} satisfies Page;
