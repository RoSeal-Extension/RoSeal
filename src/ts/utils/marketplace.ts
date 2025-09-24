import {
	type MarketplaceWidgetItem,
	searchMarketplaceWidgets,
} from "../helpers/requests/services/marketplace";

export async function searchLooks(keyword: string) {
	const data = await searchMarketplaceWidgets({
		query: keyword,
		requestId: crypto.randomUUID(),
	});

	const looks: MarketplaceWidgetItem<"Look">[] = [];
	for (const key in data.widgets) {
		const widget = data.widgets[key];
		if (widget.type === "SearchToAvatarLooksWidget") {
			for (const item of widget.content) {
				if (item.type === "Look") looks.push(item as MarketplaceWidgetItem<"Look">);
			}
		}
	}

	return looks;
}
