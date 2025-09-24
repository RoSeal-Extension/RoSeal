import { render } from "preact";
import DeletedUserProfilePreview from "src/ts/components/pages/DeletedUserPreview";
import { watchOnce } from "src/ts/helpers/elements";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { DELETED_USER_PROFILE_REGEX } from "src/ts/utils/regex";

export default {
	id: "deletedUser.profile",
	regex: [DELETED_USER_PROFILE_REGEX],
	css: ["css/deletedUserProfile.css"],
	isCustomPage: true,
	featureIds: ["previewUserDeletedProfile"],
	fn: async ({ regexMatches }) => {
		const id = Number.parseInt(regexMatches![0][1], 10);
		watchOnce(".content").then((content) =>
			render(<DeletedUserProfilePreview userId={id} />, content),
		);
	},
} satisfies Page;
