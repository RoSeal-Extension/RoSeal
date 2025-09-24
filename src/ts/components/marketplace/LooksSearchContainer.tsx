import type { Signal } from "@preact/signals";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	type HydratedWidgetLook,
	hydrateMarketplaceWidget,
	type MarketplaceWidgetItem,
	searchMarketplaceWidgets,
} from "src/ts/helpers/requests/services/marketplace";
import { isAvatarItemBlocked } from "src/ts/utils/blockedItems";
import usePromise from "../hooks/usePromise";
import type { MarketplaceCardProps } from "./Card";
import ItemsListContainer from "./ItemsListContainer";

export type LooksSearchContainerProps = {
	searchKeyword: Signal<string>;
};

export default function LooksSearchContainer({ searchKeyword }: LooksSearchContainerProps) {
	const [results] = usePromise(() => {
		if (!searchKeyword.value) return;

		const requestId = `roseal_${crypto.randomUUID()}`;
		return searchMarketplaceWidgets({
			query: searchKeyword.value,
			requestId,
		}).then((data) => {
			const looks: MarketplaceWidgetItem<"Look">[] = [];
			for (const key in data.widgets) {
				const widget = data.widgets[key];
				for (const item of widget.content) {
					if (item.type === "Look") {
						looks.push({
							type: "Look",
							id: item.id,
						});
					}
				}
			}

			return (
				hydrateMarketplaceWidget({
					content: looks,
				}) as Promise<HydratedWidgetLook[]>
			).then((data) => {
				const items: MarketplaceCardProps[] = [];
				for (const item of data) {
					if (
						isAvatarItemBlocked(
							undefined,
							undefined,
							item.curator.type,
							item.curator.id,
							item.name,
						)
					)
						continue;

					items.push({
						type: "Look" as const,
						id: item.id,
						name: item.name || "",
						creator: item.curator,
						totalValue: item.totalValue,
						totalPrice: item.totalPrice,
					});
				}

				return items;
			});
		});
	}, [searchKeyword.value]);

	if (!results?.length) return null;

	return (
		<ItemsListContainer
			className="roseal-looks-search-list"
			title={getMessage("marketplace.landing.categories.SearchToAvatarLooksWidget")}
			items={results}
		/>
	);
}
