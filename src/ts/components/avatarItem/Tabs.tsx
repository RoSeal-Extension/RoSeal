import { useCallback, useMemo, useState } from "preact/hooks";
import { ROBLOX_USERS } from "src/ts/constants/robloxUsers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getAssetById, multigetDevelopAssetsByIds } from "src/ts/helpers/requests/services/assets";
import {
	getAvatarItem,
	type MarketplaceItemType,
} from "src/ts/helpers/requests/services/marketplace";
import { canConfigureCollectibleItem } from "src/ts/helpers/requests/services/permissions";
import { getAssetTypeData } from "src/ts/utils/itemTypes";
import TabsContainer from "../core/tab/Container";
import TabNavs from "../core/tab/Navs";
import SimpleTabNav from "../core/tab/SimpleNav";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import usePromise from "../hooks/usePromise";
import AssetDependenciesList from "./DependenciesList";
import AvatarItemOwnersList from "./OwnersList";

export type AvatarItemTabsProps = {
	itemId: number;
	itemType: MarketplaceItemType;
	resalePane: HTMLElement;
	enableDependencies: boolean;
	enableOwners: boolean;
};

type ActiveTab = "dependencies" | "resellers" | "owners";

export default function AvatarItemTabs({
	itemId,
	itemType,
	resalePane,
	enableDependencies,
	enableOwners,
}: AvatarItemTabsProps) {
	const [activeTab, _setActiveTab] = useState<ActiveTab>("resellers");

	const [authenticatedUser] = useAuthenticatedUser();

	const [shouldShowDependencies] = usePromise(() => {
		if (!enableDependencies || itemType === "Bundle") return false;

		return getAssetById({
			assetId: itemId,
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
					assetIds: [itemId],
				}).then(
					(data) =>
						data[0]?.typeId &&
						(getAssetTypeData(data[0].typeId)?.is3D ||
							(data[0].creator.typeId === 1 && data[0].creator.targetId === 1)),
				),
			);
	}, [itemId, itemType]);

	const [shouldShowOwners] = usePromise(() => {
		if (!enableOwners) return false;

		return getAvatarItem({
			itemId,
			itemType,
		}).then((data) => {
			if (!data?.collectibleItemId) return false;

			if (
				(data.totalQuantity ?? 0) > 0 &&
				data.creatorType === "User" &&
				data.creatorTargetId === ROBLOX_USERS.robloxSystem
			) {
				return true;
			}

			return canConfigureCollectibleItem({
				targetType: "Asset",
				targetId: itemId,
			}).then((data) => data.isAllowed);
		});
	}, [itemId, itemType, authenticatedUser?.userId]);

	const [totalSerialNumbers] = usePromise(
		() =>
			getAvatarItem({
				itemType,
				itemId,
			}).then((data) => {
				if (!data?.collectibleItemId) return;

				return data.totalQuantity;
			}),
		[itemId, itemType],
	);

	const [isLimited] = usePromise(
		() => getAvatarItem({ itemType, itemId }).then((data) => (data?.totalQuantity ?? 0) > 0),
		[itemId, itemType],
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
				<AssetDependenciesList assetId={itemId} showCollapse={!shouldShowTabs} />
			)}
			{shouldShowOwners && (activeTab === "owners" || !shouldShowTabs) && (
				<AvatarItemOwnersList
					itemId={itemId}
					itemType={itemType}
					totalSerialNumbers={totalSerialNumbers ?? 0}
					isLimited={isLimited === true}
					isUGC={false}
					showCollapse={!shouldShowTabs}
				/>
			)}
		</>
	);
}
