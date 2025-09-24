import { effect, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { watch, watchAttributes, watchOnce } from "src/ts/helpers/elements";

type ThemeType = "light" | "dark";

export function useTheme() {
	const theme = useSignal<ThemeType>("light");

	useEffect(() => {
		watchOnce("body").then((body) => {
			theme.value = body.classList.contains("dark-theme") ? "dark" : "light";

			watchAttributes(body, () => {
				theme.value = body.classList.contains("dark-theme") ? "dark" : "light";
			}, ["class"]);

			watch(".light-theme, .dark-theme", (el) => {
				const checkTheme = () => {
					if (!el.classList.contains(`${theme}-theme`)) {
						el.classList.replace(
							`${theme.value === "light" ? "dark" : "light"}-theme`,
							`${theme.value}-theme`,
						);
					}
				};
				effect(checkTheme);

				checkTheme();
			});
		});
	}, []);

	return [
		theme.value,
		(value: ThemeType) => {
			theme.value = value;
		},
	] as const;
}
