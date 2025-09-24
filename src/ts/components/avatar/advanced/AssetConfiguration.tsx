import MdOutlineInfo from "@material-symbols/svg-400/outlined/info.svg";
import classNames from "classnames";
import { useMemo, useState } from "preact/hooks";
import { sendMessage } from "src/ts/helpers/communication/dom";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import {
	type AvatarRestrictions,
	type UserAvatar,
	setWearingAssets,
} from "src/ts/helpers/requests/services/avatar";
import { getAssetTypeData, insertAssetMetaIntoAssetList } from "src/ts/utils/itemTypes";
import { getItemTypeDisplayLabel } from "src/ts/utils/itemTypesText";
import { getAvatarAssetLink } from "src/ts/utils/links";
import PillToggle from "../../core/PillToggle";
import Slider from "../../core/Slider";
import Thumbnail from "../../core/Thumbnail";
import Tooltip from "../../core/Tooltip";
import { warning } from "../../core/systemFeedback/helpers/globalSystemFeedback";
import type { AdvancedWornAsset } from "../AdvancedCustomizationButton";
import { XYZCoordSet } from "./XYZCoordSet";

export type AssetConfigurationProps = {
	asset: AdvancedWornAsset;
	avatar: UserAvatar;
	avatarRules: AvatarRestrictions | null | undefined;
	updatePageData: (asset: AdvancedWornAsset) => void;
	incrementRefreshId: () => void;
	setAvatar: (avatar: UserAvatar) => void;
};

export const refinementItemFields = ["scale", "position", "rotation"] as const;

export default function AssetConfiguration({
	asset,
	avatar,
	avatarRules,
	setAvatar,
	updatePageData,
	incrementRefreshId,
}: AssetConfigurationProps) {
	const assetType = getAssetTypeData(asset.assetType.id);
	const [loading, setLoading] = useState(false);
	const [refinementId, setRefinementId] =
		useState<(typeof refinementItemFields)[number]>("scale");

	const [refinementLowerBounds, refinementUpperBounds] = useMemo(() => {
		if (!assetType) {
			return [];
		}

		const lowerBounds = avatarRules?.accessoryRefinementLowerBounds?.[assetType.assetType];
		const upperBounds = avatarRules?.accessoryRefinementUpperBounds?.[assetType.assetType];

		if (!lowerBounds || !upperBounds) {
			return [];
		}

		return [
			{
				scale: {
					X: lowerBounds.scale.xScale,
					Y: lowerBounds.scale.yScale,
					Z: lowerBounds.scale.zScale,
				},
				position: {
					X: lowerBounds.position.xPosition,
					Y: lowerBounds.position.yPosition,
					Z: lowerBounds.position.zPosition,
				},
				rotation: {
					X: lowerBounds.rotation.xRotation,
					Y: lowerBounds.rotation.yRotation,
					Z: lowerBounds.rotation.zRotation,
				},
			},
			{
				scale: {
					X: upperBounds.scale.xScale,
					Y: upperBounds.scale.yScale,
					Z: upperBounds.scale.zScale,
				},
				position: {
					X: upperBounds.position.xPosition,
					Y: upperBounds.position.yPosition,
					Z: upperBounds.position.zPosition,
				},
				rotation: {
					X: upperBounds.rotation.xRotation,
					Y: upperBounds.rotation.yRotation,
					Z: upperBounds.rotation.zRotation,
				},
			},
		];
	}, [avatarRules, assetType?.assetType]);

	const updateWornAssets = (newAsset?: AdvancedWornAsset) => {
		const newAssets = insertAssetMetaIntoAssetList(newAsset ?? asset, avatar.assets, false);

		setLoading(true);
		setWearingAssets({
			assets: newAssets,
		})
			.then((data) => {
				if (data.success) {
					incrementRefreshId();
					sendMessage("avatar.updateAssets", newAssets);
					setAvatar({
						...avatar,
						assets: newAssets,
					});
				} else {
					warning(getMessage("avatar.advanced.asset.errors.update"));
				}
			})
			.catch(() => warning(getMessage("avatar.advanced.asset.errors.update")))
			.finally(() => {
				setLoading(false);
			});
	};

	const canBeRefined =
		assetType && avatarRules?.accessoryRefinementTypes?.includes(assetType.assetTypeId);

	const order = asset.meta?.order ?? 0;

	const defaultCoord = refinementId === "scale" ? 1 : 0;

	return (
		<div className="asset-configuration-container text-emphasis">
			<div className="asset-details-container">
				<div className="asset-thumbnail">
					<Thumbnail
						request={{
							targetId: asset.id,
							type: "Asset",
							size: "420x420",
						}}
					/>
				</div>
				<div className="asset-details text-overflow">
					<a
						className="asset-name text-overflow text-link"
						href={getAvatarAssetLink(asset.id, asset.name)}
					>
						{asset.name}
					</a>
					<div className="asset-type-name text text-overflow small">
						{getItemTypeDisplayLabel("Asset", "category", asset.assetType.id)}
					</div>
				</div>
			</div>
			<div className="asset-configuration">
				<div
					className={classNames("layered-asset-configuration configuration-container", {
						"roseal-disabled": !assetType?.isLayered || loading,
					})}
				>
					<div className="config-section font-bold text-emphasis order-section">
						<div className="section-label">
							<div className="title-label">
								<span className="title-label-text">
									{getMessage("avatar.advanced.asset.order")}
								</span>
								<Tooltip
									button={<MdOutlineInfo className="more-info-btn roseal-icon" />}
									placement="top"
								>
									{getMessage("avatar.advanced.asset.order.tooltip")}
								</Tooltip>
							</div>
							<div className="value-label">{asLocaleString(order)}</div>
						</div>
						<Slider
							min={0}
							max={avatar.assets.reduce((max, asset2) => {
								return Math.max(
									max,
									(asset2.meta?.order ?? 0) + (asset.id === asset2.id ? 0 : 1),
								);
							}, order)}
							step={1}
							value={order}
							onUpdate={(order) => {
								updatePageData({
									...asset,
									meta: {
										...asset.meta,
										order,
									},
								});
							}}
							onFinalUpdate={() => updateWornAssets()}
						/>
					</div>
				</div>
				<div
					className={classNames("refinement-asset-configuration-container", {
						"roseal-disabled": !canBeRefined || loading,
					})}
				>
					<div className="refinement-title">
						<PillToggle
							className="refinement-toggle"
							items={refinementItemFields.map((refinementId) => ({
								id: refinementId,
								label: getMessage(`avatar.advanced.asset.${refinementId}`),
							}))}
							currentId={refinementId}
							onClick={setRefinementId}
						/>
						<div
							className="refinement-reset"
							onClick={() => {
								const newAsset = {
									...asset,
									meta: {
										...asset.meta,
										[refinementId]: {
											X: defaultCoord,
											Y: defaultCoord,
											Z: defaultCoord,
										},
									},
								};
								updatePageData(newAsset);
								updateWornAssets(newAsset);
							}}
						>
							{getMessage("avatar.advanced.asset.resetToDefault")}
						</div>
					</div>
					<div className="refinement-asset-configuration configuration-container">
						<XYZCoordSet
							key={refinementId}
							upperBounds={refinementUpperBounds?.[refinementId]}
							lowerBounds={refinementLowerBounds?.[refinementId]}
							value={
								asset.meta?.[refinementId] ?? {
									X: defaultCoord,
									Y: defaultCoord,
									Z: defaultCoord,
								}
							}
							onUpdate={(value) => {
								const newAsset = {
									...asset,
									meta: {
										...asset.meta,
										[refinementId]: value,
									},
								};
								updatePageData(newAsset);
								updateWornAssets(newAsset);
							}}
							showTotal={refinementId === "scale"}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
