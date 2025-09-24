import { Signal } from "@preact/signals";
import { getPath, getSiteType } from "./url.ts";

export type CurrentUrlData = {
	siteType: ReturnType<typeof getSiteType>;
	path: ReturnType<typeof getPath>;
	url: URL;
};

const data = new Signal<CurrentUrlData>({
	siteType: getSiteType(location.href),
	path: getPath(),
	url: new URL(location.href),
});
export default data;

globalThis.addEventListener("urlchange", () => {
	data.value = {
		siteType: data.value.siteType,
		path: getPath(),
		url: new URL(location.href),
	};
});
