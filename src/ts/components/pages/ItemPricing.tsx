import Loading from "src/ts/components/core/Loading";
import RobuxView from "src/ts/components/core/RobuxView";
import usePromise from "src/ts/components/hooks/usePromise";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { getCollectiblesMetadata } from "src/ts/helpers/requests/services/marketplace";
import { getAssetTypeData, getBundleTypeData } from "src/ts/utils/itemTypes";
import { getItemTypeDisplayLabel } from "src/ts/utils/itemTypesText";
import { getCreatorDocsLink } from "src/ts/utils/links";

export default function MarketplaceItemPricingPage() {
	const [metadata] = usePromise(getCollectiblesMetadata, []);

	return (
		<div className="item-pricing-container section">
			<div className="container-header">
				<h1>{getMessage("itemPricing.title")}</h1>
			</div>
			<div className="section-content remove-panel">
				<p className="text">
					{getMessage("itemPricing.body", {
						// 12AM PDT
						startTime: asLocaleString(new Date(111600000), {
							hour: "numeric",
							hour12: true,
						}),
						// 12PM PDT
						endTime: asLocaleString(new Date(68400000), {
							hour: "numeric",
							hour12: true,
						}),
						docsLink: (contents: string) => (
							<a
								href={getCreatorDocsLink(
									"art",
									"marketplace/publishing-to-marketplace#pricing",
								)}
								className="text-link"
								target="_blank"
								rel="noreferrer"
							>
								{contents}
							</a>
						),
					})}
				</p>
				{!metadata && <Loading />}
				{metadata && (
					<div className="item-types-tables">
						<div className="assets-section section">
							<div className="container-header">
								<h3>{getMessage("itemPricing.assets")}</h3>
							</div>
							<table className="table table-striped item-type-asset">
								<thead>
									<tr>
										<th className="text-label">
											{getMessage("itemPricing.assets.type")}
										</th>
										<th className="text-label">
											{getMessage("itemPricing.assets.floor")}
										</th>
										<th className="text-label">
											{getMessage("itemPricing.assets.ceiling")}
										</th>
									</tr>
								</thead>
								<tbody>
									{Object.entries(metadata.AllowedCollectiblesAssetTypes).map(
										([typeName, collectibleData]) => {
											if (typeName === "Tshirt") return null;

											const typeData = getAssetTypeData(typeName);

											const dynamicFloorData =
												metadata.unlimitedItemPriceFloors[typeName];
											const floorPrice =
												dynamicFloorData?.priceFloor ??
												collectibleData?.MinPrice;
											const ceilingPrice = collectibleData?.MaxPrice;

											return (
												<tr key={typeName}>
													<td>
														{getItemTypeDisplayLabel(
															"Asset",
															"category",
															typeData?.assetTypeId,
														)}
													</td>
													<td>
														<RobuxView priceInRobux={floorPrice} />
														{dynamicFloorData !== undefined && (
															<span className="text small dynamic-floor-text">
																{getMessage(
																	"itemPricing.dynamicFloor",
																)}
															</span>
														)}
													</td>
													<td>
														<RobuxView priceInRobux={ceilingPrice} />
													</td>
												</tr>
											);
										},
									)}
								</tbody>
							</table>
						</div>
						<div className="bundles-section section">
							<div className="container-header">
								<h3>{getMessage("itemPricing.bundles")}</h3>
							</div>
							<table className="table table-striped item-type-bundle">
								<thead>
									<tr>
										<th className="text-label">
											{getMessage("itemPricing.bundles.type")}
										</th>
										<th className="text-label">
											{getMessage("itemPricing.bundles.floor")}
										</th>
										<th className="text-label">
											{getMessage("itemPricing.bundles.ceiling")}
										</th>
									</tr>
								</thead>
								<tbody>
									{Object.entries(metadata.AllowedCollectiblesBundleTypes).map(
										([typeName, data]) => {
											const typeData = getBundleTypeData(typeName);
											let dynamicFloorData =
												metadata.unlimitedItemPriceFloors[typeName];

											if (!dynamicFloorData && typeData?.alternativeTypes) {
												for (const alternative of typeData.alternativeTypes) {
													dynamicFloorData =
														metadata.unlimitedItemPriceFloors[
															alternative
														];
													if (dynamicFloorData) break;
												}
											}

											const floorPrice =
												dynamicFloorData?.priceFloor ?? data.MinPrice;
											const ceilingPrice = data.MaxPrice;

											return (
												<tr key={typeName}>
													<td>
														{getItemTypeDisplayLabel(
															"Bundle",
															"category",
															typeData?.bundleTypeId,
														)}
													</td>
													<td>
														<RobuxView priceInRobux={floorPrice} />
														{dynamicFloorData !== undefined && (
															<span className="text small dynamic-floor-text">
																{getMessage(
																	"itemPricing.dynamicFloor",
																)}
															</span>
														)}
													</td>
													<td>
														<RobuxView priceInRobux={ceilingPrice} />
													</td>
												</tr>
											);
										},
									)}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
