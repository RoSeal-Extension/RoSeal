import { getAssetById, multigetDevelopAssetsByIds } from "src/ts/helpers/requests/services/assets";
import usePromise from "../hooks/usePromise";
import { getAssetTypeData } from "src/ts/utils/itemTypes";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import { ROBLOX_USERS } from "src/ts/constants/robloxUsers";
import { canConfigureCollectibleItem } from "src/ts/helpers/requests/services/permissions";
import TabNavs from "../core/tab/Navs";
import SimpleTabNav from "../core/tab/SimpleNav";
import { useCallback, useMemo, useState } from "preact/hooks";
import TabsContainer from "../core/tab/Container";
import AssetDependenciesList from "./DependenciesList";
import AssetOwnersList from "./OwnersList";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type AvatarItemTabsProps = {
	assetId: number;
	resalePane: HTMLElement;
	enableDependencies: boolean;
	enableOwners: boolean;
};

type ActiveTab = "dependencies" | "resellers" | "owners";

export default function AvatarItemTabs({
	assetId,
	resalePane,
	enableDependencies,
	enableOwners,
}: AvatarItemTabsProps) {
	const [activeTab, _setActiveTab] = useState<ActiveTab>("resellers");

	const [authenticatedUser] = useAuthenticatedUser();

	const [shouldShowDependencies] = usePromise(() => {
		if (!enableDependencies) return false;

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
	}, [assetId]);

	const [shouldShowOwners] = usePromise(() => {
		if (!enableOwners) return false;

		return getAssetById({ assetId }).then((data) => {
			if (
				data.collectiblesItemDetails?.isLimited &&
				data.creator.creatorType === "User" &&
				data.creator.creatorTargetId === ROBLOX_USERS.robloxSystem
			) {
				return true;
			}

			return canConfigureCollectibleItem({
				targetType: "Asset",
				targetId: assetId,
			}).then((data) => data.isAllowed);
		});
	}, [assetId, authenticatedUser?.userId]);

	const [totalSerialNumbers] = usePromise(
		() =>
			getAssetById({
				assetId,
			}).then((data) => data.collectiblesItemDetails?.totalQuantity),
		[assetId],
	);

	const [isLimited] = usePromise(
		() => getAssetById({ assetId }).then((data) => data.collectiblesItemDetails?.isLimited),
		[assetId],
	);

	const setActiveTab = useCallback(
		(tab: ActiveTab) => {
			if (tab === "resellers") {
				resalePane.classList.remove("hidden");
			} else {
				resalePane.classList.add("hidden");
			}

			_setActiveTab(tab);
		},
		[resalePane],
	);

	const shouldShowTabs = useMemo(() => {
		if (shouldShowDependencies && shouldShowOwners) return true;

		if (isLimited && shouldShowDependencies) return true;

		return isLimited && shouldShowOwners;
	}, [isLimited, shouldShowDependencies, shouldShowOwners]);

	if (!shouldShowOwners && !shouldShowDependencies) return null;

	return (
		<>
			{shouldShowTabs && (
				<TabsContainer>
					<TabNavs className="avatar-item-tabs">
						{isLimited && (
							<SimpleTabNav
								id="resellers"
								title={getMessage("avatarItem.tabs.resellers")}
								active={activeTab === "resellers"}
								link="#!/resellers"
								onClick={() => setActiveTab("resellers")}
							/>
						)}
						{shouldShowOwners && (
							<SimpleTabNav
								id="owners"
								title={getMessage("avatarItem.tabs.owners")}
								active={activeTab === "owners"}
								link="#!/owners"
								onClick={() => setActiveTab("owners")}
							/>
						)}
						{shouldShowDependencies && (
							<SimpleTabNav
								id="dependencies"
								title={getMessage("avatarItem.tabs.dependencies")}
								active={activeTab === "dependencies"}
								link="#!/dependencies"
								onClick={() => setActiveTab("dependencies")}
							/>
						)}
					</TabNavs>
				</TabsContainer>
			)}
			{shouldShowDependencies && (activeTab === "dependencies" || !shouldShowTabs) && (
				<AssetDependenciesList assetId={assetId} showCollapse={!shouldShowTabs} />
			)}
			{shouldShowOwners && (activeTab === "owners" || !shouldShowTabs) && (
				<AssetOwnersList
					assetId={assetId}
					totalSerialNumbers={totalSerialNumbers ?? 0}
					isLimited={isLimited === true}
					isUGC={false}
					showCollapse={!shouldShowTabs}
				/>
			)}
		</>
	);
}
