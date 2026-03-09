import { signal } from "@preact/signals";
import { render } from "preact";
import FriendsCarousel from "src/ts/components/friendsCarousel/Carousel";
import HomeUserHeader from "src/ts/components/home/HomeUserHeader";
import CustomizeLayoutButton from "src/ts/components/home/layoutCustomization/Button";
import { addMessageListener } from "src/ts/helpers/communication/dom";
import { watch, watchOnce } from "src/ts/helpers/elements";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import type { OmniSort } from "src/ts/helpers/requests/services/universes";
import { listUserFriendsCount } from "src/ts/helpers/requests/services/users";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import { HOME_REGEX } from "src/ts/utils/regex";
import { renderAfter, renderAsContainer } from "src/ts/utils/render";

export default {
	id: "home",
	regex: [HOME_REGEX],
	css: ["css/home.css"],
	hotSwappable: true,
	fn: () => {
		const state = signal<OmniSort[] | undefined>(undefined);
		const onSortsUpdated = addMessageListener("home.sortsUpdated", (data) => {
			if (!state.value) {
				state.value = data;
			}
		});

		const abortController = new AbortController();

		const checks: MaybeNestedPromise<unknown>[] = [
			featureValueIs("customizeHomeSortsLayout", true, () => {
				const el = <CustomizeLayoutButton state={state} />;

				return watch("#roseal-home-header, #HomeContainer > .section", (section) => {
					if (section.parentElement?.querySelector("#customize-home-layout-btn")) {
						return;
					}

					const component = renderAfter(el, section);

					if (component)
						watchOnce(section, true, abortController.signal).then(() => {
							render(null, component);
						});
				});
			}),

			featureValueIs("improvedConnectionsCarousel", true, async () => {
				const authenticatedUser = await getAuthenticatedUser();
				if (!authenticatedUser) return;

				const btr = signal(false);
				const btrSecondRow = signal(false);

				checks.push(
					addMessageListener("home.setBTRFeatureDetection", (args) => {
						btr.value = args.btr;
						btrSecondRow.value = args.btrSecondRow;
					}),
				);

				const friendsCount = listUserFriendsCount({
					userId: authenticatedUser.userId,
				}).then((data) => data.count);

				return watch(".game-home-page-container .friend-carousel-container", async (el) => {
					let overrideRows: number | undefined;
					const overrideRowsStr = getComputedStyle(el).getPropertyValue(
						"--roseal-override-connection-rows",
					);

					if (overrideRowsStr?.length) {
						overrideRows = Number.parseInt(overrideRowsStr, 10);
					}

					render(
						<FriendsCarousel
							userId={authenticatedUser.userId}
							overrideRows={overrideRows}
							btr={btr}
							btrSecondRow={btrSecondRow}
							friendsCount={friendsCount}
						/>,
						el,
					);

					watchOnce(el, true, abortController.signal).then(() => {
						render(null, el);
					});
				});
			}),
			featureValueIs("homeUserHeader", true, () =>
				watch("#HomeContainer > .section", (section) => {
					section.replaceChildren();

					const parent = section?.parentNode;
					if (!parent) return;

					const container = renderAsContainer(<HomeUserHeader />, section);

					if (container)
						watchOnce(parent, true, abortController.signal).then(() => {
							render(null, container);
						});
				}),
			),
		];

		return () => {
			onSortsUpdated();
			Promise.all(checks).then((values) => {
				for (const value of values) {
					if (typeof value === "function") value?.();
				}
			});
			abortController.abort();
		};
	},
} satisfies Page;
