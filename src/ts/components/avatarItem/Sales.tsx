import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import ItemField from "../core/items/ItemField.tsx";
import usePromise from "../hooks/usePromise.ts";
import {
	type MarketplaceAnalyticsFilter,
	getAvatarItem,
	queryMarketplaceAnalytics,
} from "src/ts/helpers/requests/services/marketplace.ts";
import type { AnyItemType } from "src/ts/helpers/requests/services/marketplace.ts";
import { getPassById } from "src/ts/helpers/requests/services/passes.ts";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats.ts";
import { getAssetById } from "src/ts/helpers/requests/services/assets.ts";
import RobuxView from "../core/RobuxView.tsx";
import { getPlaceUniverseId } from "src/ts/helpers/requests/services/places.ts";
import { queryExperienceTopItems } from "src/ts/helpers/requests/services/universes.ts";
import Tooltip from "../core/Tooltip.tsx";
import MdOutlineInfo from "@material-symbols/svg-400/outlined/info.svg";
import { queryCreatorAnalytics } from "src/ts/helpers/requests/services/misc.ts";

export type ItemSalesProps = {
	itemId?: number;
	itemType?: AnyItemType;
	isAvatarItem?: boolean;
	universeId?: number;
};

type SalesWithRevenue = {
	salesCount: number;
	showSalesCount: boolean;
	revenue?: number;
	hasMoreRevenue?: boolean;
};

export default function ItemSales({ itemId, itemType, isAvatarItem, universeId }: ItemSalesProps) {
	const [data] = usePromise(async (): Promise<SalesWithRevenue | undefined> => {
		if (!itemId || !itemType) return;

		if (isAvatarItem && (itemType === "Bundle" || itemType === "Asset")) {
			return getAvatarItem({
				itemId,
				itemType,
			}).then(async (data) => {
				if (!data) {
					return;
				}

				const subtype =
					data.assetType ?? (data.bundleType === 1 ? 1 : data.bundleType === 4 ? 2 : 0);
				const targetType = `${itemType}_${subtype}`;

				const filters: MarketplaceAnalyticsFilter[] = [
					{
						dimension: "TargetType",
						values: [targetType],
					},
				];
				if (itemType === "Asset") {
					filters.push({
						dimension: "TargetId",
						values: [`Asset_${itemId}`],
					});
				}
				const assetDetails =
					itemType === "Asset"
						? await getAssetById({
								assetId: itemId,
							}).catch(() => {})
						: undefined;
				let paginationToken: string | undefined;
				while (true) {
					const analyticsData = await queryMarketplaceAnalytics({
						ownerType: data.creatorType,
						ownerId: data.creatorTargetId,
						startTime: new Date("2000-01-01").toISOString(),
						endTime: new Date().toISOString(),
						filters,
						pagination: {
							pageSize: 100,
							paginationToken,
						},
					});

					let target: SalesWithRevenue | undefined;
					for (const item of analyticsData.values) {
						if (item.targetId === itemId) {
							target = {
								...item,
								showSalesCount: true,
							};
							break;
						}
					}

					if (target) {
						if (itemType === "Asset") {
							if (assetDetails) {
								if (target.salesCount < (assetDetails.sales ?? 0)) {
									target.salesCount = assetDetails.sales ?? 0;
									target.hasMoreRevenue = true;
								}
							}
						}

						return target;
					}

					const sales = assetDetails?.sales ?? 0;
					if (!analyticsData.nextPaginationToken || analyticsData.values.length === 0) {
						// attempt 2:
						while (true) {
							const analytics = await queryCreatorAnalytics({
								resourceType:
									data.creatorType === "User"
										? "RESOURCE_TYPE_CREATOR"
										: "RESOURCE_TYPE_GROUP",
								resourceId: data.creatorTargetId.toString(),
								query: {
									startTime: new Date("2000-01-01").toISOString(),
									endTime: new Date().toISOString(),
									breakdown: [],
									granularity: "METRIC_GRANULARITY_NONE",
									metric: "ItemLifetimeTransactionCount",
									filter: [
										{
											dimension: "AvatarItemId",
											values: [itemId.toString()],
										},
										{
											dimension: "AvatarItemTargetType",
											values: [itemType],
										},
									],
								},
							});

							if (!analytics.operation.done) continue;

							if (!analytics.operation.queryResult) break;

							const dataPoint =
								analytics.operation.queryResult?.values?.[0].dataPoints?.[0].value;
							if (!dataPoint) break;

							return {
								salesCount: dataPoint,
								showSalesCount: true,
							};
						}

						return {
							salesCount: sales,
							showSalesCount: sales !== 0,
						};
					}
					paginationToken = analyticsData.nextPaginationToken;
				}
			});
		}

		if (itemType === "Asset") {
			return getAssetById({
				assetId: itemId,
			}).then((data) => {
				const sales = data?.sales ?? 0;

				return {
					salesCount: sales,
					showSalesCount: sales !== 0,
				};
			});
		}

		if (itemType === "GamePass" || itemType === "DeveloperProduct") {
			const passData =
				itemType === "GamePass"
					? await getPassById({
							passId: itemId,
						})
					: undefined;

			const checkUniverseId =
				universeId ??
				(passData &&
					(await getPlaceUniverseId({
						placeId: passData?.placeId,
					})));

			if (!checkUniverseId) {
				return;
			}

			return queryExperienceTopItems({
				startTime: new Date("2000-01-01").toISOString(),
				endTime: new Date().toISOString(),
				universeId: checkUniverseId,
				monetizationDetailType: itemType === "GamePass" ? "GamePass" : "DevProduct",
				pagination: {
					pageSize: 1000,
				},
			}).then((data) => {
				let targetData: SalesWithRevenue | undefined;
				for (const item of data.values) {
					if (item.targetId === itemId) {
						targetData = {
							salesCount: item.salesCount,
							showSalesCount: true,
							revenue: item.revenue,
						};
					}
				}

				if (targetData) {
					if (passData) {
						if (targetData.salesCount < passData.gamePassSalesData.totalSales) {
							targetData.salesCount = passData.gamePassSalesData.totalSales;
							targetData.hasMoreRevenue = true;
						}
					}
					return targetData;
				}

				const totalSales = passData?.gamePassSalesData.totalSales ?? 0;
				return {
					salesCount: totalSales,
					showSalesCount: totalSales !== 0,
				};
			});
		}
	});

	return (
		<>
			{data?.showSalesCount && (
				<ItemField
					useNewClasses={isAvatarItem}
					title={getMessage("item.sales")}
					id="item-sales-field"
				>
					<div className="field-content">
						<span className="text font-body">
							{data.revenue
								? getMessage("item.salesWithRevenue", {
										sales: asLocaleString(data.salesCount),
										revenue: <RobuxView priceInRobux={data.revenue} gray />,
										hasMoreRevenue: data.hasMoreRevenue ?? false,
									})
								: asLocaleString(data.salesCount)}
						</span>
						{(data.hasMoreRevenue || itemType === "GamePass") && (
							<Tooltip
								button={<MdOutlineInfo className="more-info-btn roseal-icon" />}
								placement="top"
							>
								{getMessage(
									itemType === "GamePass"
										? "item.salesInaccurateTooltip.pass"
										: "item.salesInaccurateTooltip",
								)}
							</Tooltip>
						)}
					</div>
				</ItemField>
			)}
		</>
	);
}
