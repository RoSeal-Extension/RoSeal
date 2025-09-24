import { lazyLoad } from "src/ts/utils/lazyLoad.ts";
import { DurationFormat } from "@formatjs/intl-durationformat";
import { locales } from "./locales";

export const getDurationFormat = lazyLoad(() =>
	"DurationFormat" in window.Intl
		? new window.Intl.DurationFormat(locales, {
				style: "narrow",
			})
		: new DurationFormat(locales, {
				style: "narrow",
			}),
);
