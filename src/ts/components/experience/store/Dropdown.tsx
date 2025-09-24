import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { watchAttributes, watchOnce } from "src/ts/helpers/elements";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { renderIn } from "src/ts/utils/render";
import Dropdown from "../../core/Dropdown";
import DeveloperProducts from "./DeveloperProducts";
import { getFlag } from "src/ts/helpers/flags/flags";

export type StoreDropdownProps = {
	universeId: number;
	placeId: number;
};

export default function StoreDropdown({ universeId, placeId }: StoreDropdownProps) {
	const state = useSignal<"developerProducts" | "passes">("passes");

	const toggleState = (newState: (typeof state)["value"]) => {
		const passes = document.body.querySelector<HTMLElement>(
			"#roseal-game-passes, #rbx-game-passes",
		);
		const pane = passes?.closest<HTMLElement>(".tab-pane");
		const devProducts = document.body.querySelector<HTMLElement>("#roseal-developer-products");

		pane?.classList.add(`show-${newState.toLowerCase()}`);
		pane?.classList.remove(`show-${state.value.toLowerCase()}`);
		if (devProducts) {
			devProducts.style.setProperty(
				"display",
				newState === "developerProducts" ? null : "none",
			);
		} else if (pane && newState === "developerProducts") {
			getFlag("developerProducts", "experienceStoreOffSaleOffByDefault").then((flag) => {
				renderIn(
					<DeveloperProducts
						universeId={universeId}
						placeId={placeId}
						offSaleDefault={!flag}
					/>,
					pane,
				);
			});
		}

		if (passes) {
			passes.style.setProperty("display", newState === "passes" ? null : "none");
		}

		state.value = newState;
		if (newState === "passes") {
			location.hash = "#!/store";
		} else {
			location.hash = "#!/store/developer-products";
		}
	};

	useEffect(() => {
		if (location.hash === "#!/store/developer-products") {
			// So Roblox knows the memo of having the store tab open
			watchOnce("#tab-store").then((storeTab) => {
				if (storeTab.classList.contains("active")) {
					return toggleState("developerProducts");
				}

				watchAttributes(
					storeTab,
					(_, _2, _3_, _4, kill) => {
						if (storeTab.classList.contains("active")) {
							toggleState("developerProducts");
							kill?.();
						}
					},
					["class"],
				);
			});
			location.hash = "#!/store";
		}
	}, []);

	useEffect(() => {
		const listener = () => {
			if (location.hash === "#!/store" && state.value === "developerProducts") {
				location.hash = "#!/store/developer-products";
			}
		};

		globalThis.addEventListener("hashchange", listener);

		return () => {
			globalThis.removeEventListener("hashchange", listener);
		};
	}, [state]);

	return (
		<Dropdown
			selectionItems={[
				{
					label: getMessage("experience.store.passes"),
					value: "passes",
				},
				{
					label: getMessage("experience.store.developerProducts"),
					value: "developerProducts",
				},
			]}
			selectedItemValue={state.value}
			onSelect={toggleState}
		/>
	);
}
