import { useState } from "preact/hooks";
import Icon from "../core/Icon.tsx";
import Loading from "../core/Loading.tsx";
import usePromise from "../hooks/usePromise.ts";
import { getMessage } from "../../helpers/i18n/getMessage.ts";
import {
	getAssetById,
	multigetDevelopAssetsByIds,
} from "../../helpers/requests/services/assets.ts";
import { getAssetDependencies } from "../../utils/assets.ts";
import AssetDependency from "./Dependency.tsx";
import TextInput from "../core/TextInput.tsx";
import { getAssetTypeData } from "src/ts/utils/itemTypes.ts";
import classNames from "classnames";

export type AssetDependenciesListProps = {
	assetId: number;
	isHidden?: boolean;
	showCollapse?: boolean;
};

export default function AssetDependenciesList({
	assetId,
	isHidden,
	showCollapse,
}: AssetDependenciesListProps) {
	const [shouldShowDependencies] = usePromise(() => {
		if (!isHidden) return true;

		return getAssetById({
			assetId,
		})
			.then((data) => {
				if (data.creator.creatorType === "User" && data.creator.creatorTargetId === 1)
					return true;

				const typeData = getAssetTypeData(data.assetTypeId);
				if (typeData?.is3D || typeData?.isAnimated) {
					return true;
				}

				return false;
			})
			.catch(() =>
				multigetDevelopAssetsByIds({
					assetIds: [assetId],
				}).then(
					(data) =>
						data[0]?.typeId &&
						(getAssetTypeData(data[0].typeId)?.is3D ||
							(data[0].creator.typeId === 1 && data[0].creator.targetId === 1)),
				),
			);
	}, [assetId, isHidden]);
	const [targetVersion, setTargetVersion] = useState<number | undefined>(undefined);
	const [collapsed, setCollapsed] = useState(true);
	const [dependencies, dependenciesFetched] = usePromise(
		() =>
			shouldShowDependencies
				? getAssetDependencies(assetId, targetVersion).then((ids) => {
						if (!ids) {
							return;
						}

						return Promise.all(
							ids.map((id) =>
								getAssetById({
									assetId: id,
								}).catch(() => {}),
							),
						).then((assets) => assets.filter((asset) => asset !== undefined));
					})
				: undefined,
		[assetId, targetVersion, shouldShowDependencies],
	);

	if ((!dependencies && targetVersion === undefined && showCollapse) || !shouldShowDependencies) {
		return null;
	}

	return (
		<div id="item-dependencies">
			<div className="dependencies-container">
				{showCollapse && (
					<div
						className={classNames("container-header", {
							"cursor-pointer": showCollapse,
						})}
						onClick={() => setCollapsed(!collapsed)}
					>
						<h2>{getMessage("avatarItem.dependencies.title")}</h2>
						<Icon name={collapsed ? "down" : "up"} size="16x16" />
					</div>
				)}
				{(!collapsed || !showCollapse) && (
					<div className="container-list-container">
						<div className="version-name-text text container-header">
							<label className="input-label text-label">
								{getMessage("avatarItem.dependencies.version")}
							</label>
							<TextInput
								type="number"
								className="version-input"
								placeholder="1"
								min={1}
								onChange={(value) => {
									setTargetVersion(Number.parseInt(value, 10) || undefined);
								}}
								value={targetVersion}
							/>
						</div>
						{!dependenciesFetched && <Loading />}
						{dependenciesFetched && !dependencies && (
							<div className="text-center text">
								{getMessage("avatarItem.dependencies.noResults")}
							</div>
						)}
						<div className="hlist item-cards container-list">
							{dependencies?.map((dependency) => (
								<AssetDependency dependency={dependency} key={dependency.assetId} />
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
