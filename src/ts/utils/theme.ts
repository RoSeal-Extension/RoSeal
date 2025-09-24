import { watchOnce } from "../helpers/elements";

export async function syncTheme() {
	const body = await watchOnce("body");
	const navContainer = watchOnce("#navigation-container");

	const handleMatches = async (isLight: boolean) => {
		const isRobloxLight = body.classList.contains("light-theme");

		if (isLight && !isRobloxLight) {
			body.classList.replace("dark-theme", "light-theme");
		} else if (!isLight && isRobloxLight) {
			body.classList.replace("light-theme", "dark-theme");
		}

		navContainer.then((nav) => {
			if (isLight && !isRobloxLight) {
				nav.classList.replace("dark-theme", "light-theme");
			} else if (!isLight && isRobloxLight) {
				nav.classList.replace("light-theme", "dark-theme");
			}
		});
	};

	const matchesDark = globalThis.matchMedia("(prefers-color-scheme: dark)");

	handleMatches(!matchesDark.matches);

	const changeListener = () => handleMatches(!matchesDark.matches);
	matchesDark.addEventListener("change", changeListener);

	return () => {
		matchesDark.removeEventListener("change", changeListener);
	};
}
