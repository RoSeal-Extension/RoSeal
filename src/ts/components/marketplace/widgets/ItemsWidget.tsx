import { useMemo } from "preact/hooks";
import { getMessage, hasMessage } from "src/ts/helpers/i18n/getMessage";
import { hydrateMarketplaceWidget } from "src/ts/helpers/requests/services/marketplace";
import { isAvatarItemBlocked } from "src/ts/utils/blockedItems";
import usePromise from "../../hooks/usePromise";
import type { MarketplaceCardProps } from "../Card";
import ItemsListContainer from "../ItemsListContainer";
import type { MarketplacePageWidget } from "./Results.ts";

export default function MarketplaceItemsWidget({
	type,
	title: _title,
	description,
	items,
}: MarketplacePageWidget) {
	const [data] = usePromise(
		() =>
			items &&
			hydrateMarketplaceWidget({
				content: items,
			}).then((data) => {
				const items: MarketplaceCardProps[] = [];

				for (const item of data) {
					switch (item.type) {
						case "Look": {
							items.push({
								type: "Look",
								id: item.id,
								name: item.name || "",
								creator: item.curator,
								totalValue: item.totalValue,
								totalPrice: item.totalPrice,
							});
							break;
						}
						case "Asset": {
							if (
								isAvatarItemBlocked(
									item.id,
									item.type,
									undefined,
									undefined,
									item.name,
								)
							)
								continue;

							items.push({
								type: "Asset",
								id: item.id,
								name: item.name,
								creator: item.creator,
								totalPrice: item.price,
							});
							break;
						}
						case "Bundle": {
							if (
								isAvatarItemBlocked(
									item.id,
									item.type,
									undefined,
									undefined,
									item.name,
								)
							)
								continue;

							items.push({
								type: "Bundle",
								id: item.id,
								name: item.name,
								creator: item.creator,
								totalPrice: item.price,
							});
							break;
						}
					}
				}

				return items;
			}),
		[items],
	);
	const title = useMemo(() => {
		if (_title) return _title;

		const message = `marketplace.landing.categories.${type}`;
		if (hasMessage(message)) return getMessage(message);

		return type;
	}, [type, _title]);

	return (
		<ItemsListContainer
			listClassName="hlist item-cards-stackable organic-items-wrapper"
			title={title}
			description={description}
			items={data || undefined}
		/>
	);
}
