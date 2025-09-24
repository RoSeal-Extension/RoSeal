import TrendingSearchesPage from "src/ts/components/pages/TrendingSearches";
import { modifyTitle, watchOnce } from "src/ts/helpers/elements";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { TRENDING_SEARCHES_REGEX } from "src/ts/utils/regex";
import { renderAppend } from "src/ts/utils/render";

export default {
	id: "trendingSearches",
	regex: [TRENDING_SEARCHES_REGEX],
	featureIds: ["trendingSearchesPage"],
	isCustomPage: true,
	css: ["css/trendingSearches.css"],
	fn: () => {
		modifyTitle("Trending Searches");
		watchOnce(".content").then((content) => renderAppend(<TrendingSearchesPage />, content));
	},
} satisfies Page;
