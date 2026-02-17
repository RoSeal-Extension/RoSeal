import {
	getMarketplaceWidgets,
	type MarketplaceWidgetContext,
	type MarketplaceWidgetItem,
	type MarketplaceWidgetItemType,
	type MarketplaceWidgetType,
} from "src/ts/helpers/requests/services/marketplace";
import usePromise from "../../hooks/usePromise";
import ShimmerCard from "../ShimmerCard";
import MarketplaceSponsoredWidget from "../SponsoredWidget";
import MarketplaceItemsWidget from "./ItemsWidget";
import MarketplaceRFYWidget from "./RFYWidget";

export type MarketplacePageWidget = {
	type: MarketplaceWidgetType;
	title?: string;
	description?: string;
	isSponsored?: boolean;
	items?: MarketplaceWidgetItem<MarketplaceWidgetItemType>[];
};

export type MarketplaceResultsContainerProps = {
	tabs: MarketplaceWidgetContext[];
};

export default function MarketplaceResultsContainer({ tabs }: MarketplaceResultsContainerProps) {
	const [widgets, , error] = usePromise(() => {
		const requestId = `roseal_${crypto.randomUUID()}`;

		return Promise.all(
			tabs.map((context) =>
				getMarketplaceWidgets({
					requestId,
					context,
				}),
			),
		).then((allData) => {
			const widgets: MarketplacePageWidget[] = [];
			let hasPassedOrganic = false;
			let hasPassedOrganic2 = false;
			for (const data of allData)
				for (const key in data.widgets) {
					const item = data.widgets[key];
					let isSponsored = false;
					if (item.type === "OrganicContent") {
						if (hasPassedOrganic) {
							if (hasPassedOrganic2) continue;

							hasPassedOrganic2 = true;
							isSponsored = true;
						}

						hasPassedOrganic = true;
					} else if (
						!item.content ||
						widgets.some((widget) => item.type === widget.type)
					) {
						continue;
					}

					widgets.push({
						type: item.type,
						title: item.template.localizedTitle,
						description: item.template.localizedDescription,
						isSponsored,
						items: item.content,
					});
				}

			return widgets;
		});
	}, [tabs]);

	if (error) return null;

	return (
		<div id="roseal-main-view">
			<div id="react-items-container" className="results-container">
				<div id="results" className="results-container">
					{!widgets && (
						<ul
							id="catalog-react-shimmer-container"
							className="hlist item-cards-stackable"
						>
							{new Array(50).fill(<ShimmerCard />)}
						</ul>
					)}
					{widgets && (
						<div className="marketplace-landing-container">
							{widgets.map((widget) => {
								if (widget.type === "OrganicContent") {
									if (widget.isSponsored) {
										return <MarketplaceSponsoredWidget key={widget.type} />;
									}
									return <MarketplaceRFYWidget key={widget.type} />;
								}

								return <MarketplaceItemsWidget key={widget.type} {...widget} />;
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
