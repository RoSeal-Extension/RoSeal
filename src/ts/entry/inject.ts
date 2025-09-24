import { pages } from "#pages/inject";
import "../helpers/hijack/fetch.ts";
import "../helpers/hijack/react.ts";
import { handleInjectPages } from "../helpers/pages/handleInjectPages.ts";
import currentUrl from "../utils/currentUrl.ts";

handleInjectPages(pages);
let path = currentUrl.value.path.path;
currentUrl.subscribe(() => {
	const newPath = currentUrl.value.path.path;
	if (newPath !== path) {
		path = newPath;
		handleInjectPages(pages);
	}
});
