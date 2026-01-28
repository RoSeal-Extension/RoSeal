import classNames from "classnames";
import { useEffect, useMemo, useState } from "preact/hooks";
import { tryRenderAvatar } from "src/ts/utils/avatar.ts";
import { filterWornAssets, getAssetTypeData, placeAssetTypeId } from "src/ts/utils/itemTypes.ts";
import { getItemTypeDisplayLabel } from "src/ts/utils/itemTypesText.ts";
import { modifyTitle } from "../../helpers/elements.ts";
import { getMessage } from "../../helpers/i18n/getMessage.ts";
import {
	getAssetById,
	multigetDevelopAssetsByIds,
} from "../../helpers/requests/services/assets.ts";
import {
	type AvatarBodyColorsRender,
	getAuthenticatedUserAvatar,
} from "../../helpers/requests/services/avatar.ts";
import { multigetGroupsByIds } from "../../helpers/requests/services/groups.ts";
import { listUserItemInstances } from "../../helpers/requests/services/inventory.ts";
import { getAvatarItem } from "../../helpers/requests/services/marketplace.ts";
import { getUserById } from "../../helpers/requests/services/users.ts";
import {
	getAvatarAssetLink,
	getAvatarMarketplaceLink,
	getConfigureAvatarAssetLink,
	getCreatorProfileLink,
	getCreatorStoreAssetLink,
	getEditAvatarLink,
	getExperienceLink,
	getGeneralReportAbuseLinkV2,
	getRolimonsHiddenAvatarAssetLink,
} from "../../utils/links.ts";
import AddToProfileButton from "../avatarItem/AddToProfileButton.tsx";
import AssetDependenciesList from "../avatarItem/DependenciesList.tsx";
import FavoriteItemButton from "../avatarItem/FavoriteButton.tsx";
import ItemBundles from "../avatarItem/ItemBundles.tsx";
import AvatarItemOwnedPopover from "../avatarItem/ItemOwnedPopover.tsx";
import ItemTags from "../avatarItem/ItemTags.tsx";
import PriceInfo from "../avatarItem/PriceInfo.tsx";
import SearchByCreatorButton from "../avatarItem/SearchByCreatorButton.tsx";
import Button from "../core/Button.tsx";
import Icon from "../core/Icon.tsx";
import ItemContextMenu from "../core/ItemContextMenu.tsx";
import Linkify from "../core/Linkify.tsx";
import Loading from "../core/Loading.tsx";
import MentionLinkify from "../core/MentionLinkify.tsx";
import ThirdPartyLinkModal from "../core/ThirdPartyLinkModal.tsx";
import Thumbnail from "../core/Thumbnail.tsx";
import Thumbnail3d from "../core/Thumbnail3d.tsx";
import ToggleTarget from "../core/ToggleTarget.tsx";
import Tooltip from "../core/Tooltip.tsx";
import Page404 from "../core/errors/404.tsx";
import ItemField from "../core/items/ItemField.tsx";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser.ts";
import useFeatureValue from "../hooks/useFeatureValue.ts";
import useFlag from "../hooks/useFlag.ts";
import usePromise from "../hooks/usePromise.ts";
import useThumbnail from "../hooks/useThumbnail.ts";
import VerifiedBadge from "../icons/VerifiedBadge.tsx";
import BlockItemButton from "../item/BlockItemButton.tsx";
import ItemBlockedScreen from "../item/ItemBlockedScreen.tsx";
import ItemProductInfo from "../item/ProductInfo.tsx";
import UpdatedCreatedField from "../item/UpdatedCreated.tsx";
import CopyShareLinkButton from "../misc/CopyShareLinkButton.tsx";
import { canConfigureCollectibleItem } from "src/ts/helpers/requests/services/permissions.ts";
import ItemConnectionsOwned from "../item/ConnectionsOwned.tsx";

export type AvatarAssetContainerProps = {
	assetId: number;
};

export default function AvatarAssetContainer({ assetId }: AvatarAssetContainerProps) {
	const [authenticatedUser] = useAuthenticatedUser();

	const [searchByCreatorEnabled] = useFeatureValue("avatarItemSearchByCreator", false);
	const [refreshEnabled] = useFeatureValue("avatarItemRefreshDetails", false);
	const [productDetailsEnabled] = useFeatureValue("viewItemProductInfo", false);
	const [itemMentionsEnabled] = useFeatureValue("formatItemMentions", false);
	const [showItemBundlesEnabled] = useFeatureValue("viewAvatarItemBundles", false);
	const [updatedCreatedEnabled] = useFeatureValue("avatarItemCreatedUpdated", false);
	const [showAssetDependenciesEnabled] = useFeatureValue("viewAvatarAssetDependencies", false);
	const [copyShareLinksEnabled] = useFeatureValue("copyShareLinks", false);
	const [blockedItemsEnabled] = useFeatureValue("blockedItems", false);
	const [viewItemTagsEnabled] = useFeatureValue("viewAvatarItemTags", false);
	const [viewObtainedDatesPopoverEnabled] = useFeatureValue(
		"viewInventoryItemObtainedDate",
		false,
	);
	const [viewConnectionsOwnedEnabled] = useFeatureValue("viewAvatarItemConnectionsOwned", false);

	const showRolimonsLink = useFlag("thirdParties", "showRolimonsLink");
	const [showRolimonsLinkModal, setShowRolimonsLinkModal] = useState(false);

	const [tryOnEnabled, setTryOnEnabled] = useState(false);
	const [threeDeeEnabled, setThreeDeeEnabled] = useState(false);
	const [exists, setExists] = useState(true);

	const [data, , , refetchData] = usePromise(
		(increment) =>
			getAssetById({
				assetId,
				overrideCache: !!increment,
			})
				.catch(() =>
					multigetDevelopAssetsByIds({
						assetIds: [assetId],
						overrideCache: !!increment,
					}).then((data) => {
						const item = data[0];
						if (!item) {
							return setExists(false);
						}

						return {
							name: item.name,
							description: item.name,,
							assetTypeId: item.typeId,
							assetId: item.id,
							collectibleItemId: null,
							collectibleProductId: null,
							collectiblesItemDetails: null,
							contentRatingTypeId: 0,
							created: item.created,
							updated: item.updated,
							iconImageAssetId: null,
							isForSale: false,
							isLimited: false,
							isLimitedUnique: false,
							isNew: false,
							targetId: 0,
							productId: null,
							remaining: null,
							saleAvailabilityLocations: null,
							saleLocation: null,
							sales: null,
							productType: null,
							priceInRobux: null,
							priceInTickets: null,
							premiumPriceInRobux: null,
							isPublicDomain: item.isPublicDomainEnabled,
							minimumMembershipLevel: 0,
							creator: {
								creatorTargetId: item.creator.targetId,
								creatorType: item.creator.type,
							},
						};
					}),
				)
				.then((data) => {
					if (!data) {
						return;
					}

					modifyTitle(data.name);
					if (data.assetTypeId === placeAssetTypeId) {
						location.href = getExperienceLink(assetId, data.name);
						return;
					}

					if (!getAssetTypeData(data.assetTypeId)?.isAvatarAsset) {
						location.href = getCreatorStoreAssetLink(assetId, data.name);
						return;
					}

					const link = getAvatarAssetLink(data.assetId, data.name, true);
					if (location.pathname !== link) {
						history.replaceState(undefined, "", link);
					}

					return data;
				}),
		[],
	);

	const [creator] = usePromise(() => {
		if (!data) {
			return;
		}

		if ("name" in data.creator) {
			return {
				...data.creator,
				name: data.creator.name!,
				type: data.creator.creatorType!,
			};
		}

		return data.creator.creatorType === "Group"
			? multigetGroupsByIds({
					groupIds: [data.creator.creatorTargetId],
				})
					.then((data) => data[0])
					.then((creator) => ({
						creatorTargetId: data.creator.creatorTargetId,
						creatorType: data.creator.creatorType,
						id: 0,
						hasVerifiedBadge: creator.hasVerifiedBadge,
						name: creator.name,
						type: data.creator.creatorType!,
					}))
			: getUserById({
					userId: data.creator.creatorTargetId,
				}).then(
					(creator) =>
						creator && {
							creatorTargetId: data.creator.creatorTargetId,
							creatorType: data.creator.creatorType,
							id: 0,
							hasVerifiedBadge: creator.hasVerifiedBadge,
							name: creator.name,
							type: data.creator.creatorType!,
						},
				);
	}, [!data, data && "name" in data.creator]);
	const [canConfigure] = usePromise(
		() =>
			canConfigureCollectibleItem({
				targetType: "Asset",
				targetId: assetId,
			}).then((data) => data.isAllowed),
		[assetId],
	);
	const canTryOn = useMemo(
		() =>
			!!data?.creator &&
			!(data.creator.creatorTargetId === 1 && data.creator.creatorType === "User"),
		[data?.creator?.creatorTargetId, data?.creator?.creatorType],
	);

	const [itemInstances, , , refetchItemInstances] = usePromise(
		() =>
			authenticatedUser
				? listUserItemInstances({
						itemType: "Asset",
						itemId: assetId,
						userId: authenticatedUser?.userId,
					})
				: undefined,
		[authenticatedUser?.userId],
	);
	const [userAvatar] = usePromise(
		() => authenticatedUser && getAuthenticatedUserAvatar(),
		[authenticatedUser?.userId],
	);
	const [unlockedLimitsEnabled, , fetchedUnlockedLimitsEnabled] = useFeatureValue(
		"avatarUnlockedAccessoryLimits",
		false,
	);

	const avatarRenderData = useMemo(() => {
		if (userAvatar && fetchedUnlockedLimitsEnabled && data) {
			const bodyColors = {} as AvatarBodyColorsRender;
			for (const key in userAvatar.bodyColor3s) {
				bodyColors[key.replace(/3$/, "") as keyof AvatarBodyColorsRender] =
					`#${userAvatar.bodyColor3s[key as keyof typeof userAvatar.bodyColor3s]}`;
			}

			return {
				assets: filterWornAssets(
					[
						{
							id: assetId,
							assetType: {
								id: data.assetTypeId,
							},
							meta: getAssetTypeData(data.assetTypeId)?.meta,
						},
						...userAvatar.assets,
					],
					unlockedLimitsEnabled,
				).assets,
				bodyColors,
				playerAvatarType: {
					playerAvatarType: userAvatar.playerAvatarType,
				},
				scales: userAvatar.scales,
			};
		}
	}, [!userAvatar, !data]);

	const [tryOnThumbnail] = usePromise(
		() =>
			avatarRenderData && canTryOn
				? tryRenderAvatar({
						avatarDefinition: avatarRenderData!,
						thumbnailConfig: {
							size: "420x420",
							thumbnailId: 1,
							thumbnailType: "2dWebp",
						},
					})
				: undefined,
		[!userAvatar, data, !avatarRenderData],
	);

	const isLimited = useMemo(
		() => !!(data?.isLimited || data?.isLimitedUnique),
		[data?.isLimited, data?.isLimitedUnique],
	);
	const isLimited2 = useMemo(
		() => data?.collectiblesItemDetails?.isLimited === true,
		[data?.collectiblesItemDetails?.isLimited],
	);
	const restrictionIcon = useMemo(() => {
		if (!data) {
			return;
		}

		if (data.isLimitedUnique || data.collectiblesItemDetails?.isLimited) {
			return "limited-unique-label";
		}

		if (data.isLimited) {
			return "limited-label";
		}
	}, [data?.isLimited, data?.isLimitedUnique, data?.collectiblesItemDetails?.isLimited]);

	const isOnsale = useMemo(
		() => !!(data?.isForSale || data?.isPublicDomain || data?.priceInRobux),
		[data?.assetId],
	);

	const assetTypeDisplayName = useMemo(() => {
		if (!data) {
			return;
		}

		return getItemTypeDisplayLabel("Asset", "category", data.assetTypeId);
	}, [data?.assetTypeId]);
	const quantityLimited = useMemo(() => !isLimited || isLimited2, [isLimited, isLimited2]);
	const price = useMemo(() => data?.priceInRobux, [data?.priceInRobux]);
	const [_thumbnail] = useThumbnail({
		targetId: assetId,
		type: "Asset",
		size: "420x420",
	});
	const isModerated = _thumbnail?.state === "Blocked";
	const canFavorite = useMemo(() => {
		return canTryOn || isModerated;
	}, [isModerated, canTryOn]);

	useEffect(() => {
		getAvatarItem({
			itemId: assetId,
			itemType: "Asset",
			overrideCache: !!data?.priceInRobux,
		})
			.then((data) => {
				if (!data?.name) {
					return;
				}

				location.href = getAvatarAssetLink(assetId);
			})
			.catch(() => {});
	}, [assetId, data?.priceInRobux ?? undefined]);
	const reportAbuseUrl = useMemo(() => {
		if (!data) return;

		return getGeneralReportAbuseLinkV2(
			assetId,
			"Asset",
			authenticatedUser?.userId,
			JSON.stringify({
				assetType: getAssetTypeData(data.assetTypeId)?.assetType,
			}),
		);
	}, [authenticatedUser?.userId, assetId, data?.assetTypeId]);

	if (!exists) {
		return <Page404 />;
	}

	const itemOwnedPopover = !!itemInstances?.data.length && (
		<span
			className={classNames("item-owned", {
				"roseal-item-owned": viewObtainedDatesPopoverEnabled,
			})}
		>
			<div className="label-checkmark">
				<Icon name="checkmark-white-bold" />
			</div>
			<span>
				{getMessage("avatarItem.itemOwned", {
					quantityLimited,
					count: itemInstances.data.length,
				})}
			</span>
			{viewObtainedDatesPopoverEnabled && (
				<Icon name="down" size="16x16" className="menu-open-btn" />
			)}
		</span>
	);

	return (
		<>
			{blockedItemsEnabled && (
				<ItemBlockedScreen itemType="Asset" itemId={assetId} isHidden />
			)}
			<div id="hidden-avatar-asset-container">
				{data && (
					<div id="hidden-asset-banner">
						<ThirdPartyLinkModal
							link={getRolimonsHiddenAvatarAssetLink(assetId)}
							show={showRolimonsLinkModal}
							onClose={() => setShowRolimonsLinkModal(false)}
						/>
						<div className="icon-container">
							<Icon name={isModerated ? "blocked" : "pending"} />
						</div>
						<div className="text-container">
							<div className="font-header-1">
								{getMessage(
									`avatarItem.hiddenBanner.title.${isModerated ? "moderated" : "unreleased"}`,
								)}
							</div>
							<div className="text small">
								{getMessage(
									`avatarItem.hiddenBanner.body.${isModerated ? "moderated" : "unreleased"}`,
								)}
							</div>
							{showRolimonsLink && (
								<div className="text small rolimons-link">
									{getMessage("avatarItem.hiddenBanner.footer", {
										rolimonsLink: (contents: string) => (
											<a
												href={getRolimonsHiddenAvatarAssetLink(assetId)}
												className="text-link"
												onClick={(e) => {
													e.preventDefault();
													setShowRolimonsLinkModal(true);
												}}
											>
												{contents}
											</a>
										),
									})}
								</div>
							)}
						</div>
						<Button
							as="a"
							type="secondary"
							className="return-to-marketplace-btn"
							href={getAvatarMarketplaceLink()}
						>
							{getMessage("avatarItem.hiddenBanner.returnToMarketplace")}
						</Button>
					</div>
				)}
				{showItemBundlesEnabled && <ItemBundles assetId={assetId} />}
				{/* @ts-expect-error: Fine */}
				<item-details>
					<div className="content">
						<div className="page-content menu-shown">
							<div>
								<div className="item-details-thumbnail-container">
									<div className="thumbnail-holder">
										{threeDeeEnabled ? (
											tryOnEnabled ? (
												<Thumbnail3d
													key="try-3d"
													data={{
														type: "AvatarRender",
														data: avatarRenderData,
													}}
												/>
											) : (
												<Thumbnail3d
													key="3d"
													data={{
														type: "Asset",
														assetId,
													}}
												/>
											)
										) : tryOnEnabled ? (
											<Thumbnail key="try-2d" data={tryOnThumbnail || null} />
										) : (
											<Thumbnail
												key="2d"
												request={{
													type: "Asset",
													targetId: assetId,
													size: "420x420",
												}}
											/>
										)}
									</div>
									<div className="thumbnail-ui-container">
										<div className="top-align-container inner-thumbnail-ui-container">
											<div className="left-align-container" />
											<div className="right-align-container">
												{data?.isNew && (
													<div className=" item-cards-stackable">
														<div className="asset-status-icon">
															<div className="status-new">
																<div>
																	{getMessage(
																		"avatarItem.status.New",
																	)}
																</div>
															</div>
														</div>
													</div>
												)}
											</div>
										</div>
										<div className="bottom-align-container inner-thumbnail-ui-container">
											<div className="left-align-container">
												{restrictionIcon && (
													<Icon
														name={restrictionIcon}
														className="restriction-icon"
													/>
												)}
											</div>
											<div className="right-align-container">
												<div className="thumbnail-button-container">
													{data && canTryOn && authenticatedUser && (
														<Button
															className="enable-three-dee button-placement"
															type="control"
															width="default"
															onClick={() =>
																setTryOnEnabled(!tryOnEnabled)
															}
														>
															{getMessage(
																`avatarItem.thumbnail.${tryOnEnabled ? "takeOff" : "tryOn"}`,
															)}
														</Button>
													)}
													{data &&
														getAssetTypeData(data?.assetTypeId)
															?.is3D && (
															<Button
																className="enable-three-dee button-placement"
																type="control"
																width="default"
																onClick={() =>
																	setThreeDeeEnabled(
																		!threeDeeEnabled,
																	)
																}
															>
																{getMessage(
																	`avatarItem.thumbnail.${threeDeeEnabled ? "2" : "3"}d`,
																)}
															</Button>
														)}
												</div>
											</div>
										</div>
									</div>
									{viewConnectionsOwnedEnabled && (
										<ItemConnectionsOwned itemType="Asset" itemId={assetId} />
									)}
								</div>
								{!data && <Loading />}
								{data && (
									<div id="item-info-container-frontend">
										<div className="item-details-info-content shopping-cart">
											<div className="item-details-info-header border-bottom item-name-container">
												<div className="left">
													<div className="item-details-name-row">
														<h1>{data.name}</h1>
													</div>
													<div className="item-details-creator-container">
														{creator && "name" in creator && (
															<>
																<span className="text-label">
																	{getMessage("item.by", {
																		creator: (
																			<a
																				href={getCreatorProfileLink(
																					creator.creatorTargetId,
																					creator.creatorType!,
																					creator.name!,
																				)}
																				className="text-link"
																			>
																				{creator.name}
																			</a>
																		),
																	})}
																	{creator.hasVerifiedBadge && (
																		<>
																			{" "}
																			<VerifiedBadge className="verified-badge-icon-item-details" />
																		</>
																	)}
																</span>
																{searchByCreatorEnabled && (
																	<SearchByCreatorButton
																		itemId={assetId}
																		itemType="Asset"
																		assetOrBundleTypeId={
																			data.assetTypeId
																		}
																		creator={creator}
																	/>
																)}
															</>
														)}
														{itemOwnedPopover &&
															(viewObtainedDatesPopoverEnabled ? (
																<AvatarItemOwnedPopover
																	itemType="Asset"
																	itemId={assetId}
																	button={itemOwnedPopover}
																/>
															) : (
																itemOwnedPopover
															))}
													</div>
												</div>
												<div className="right">
													<ItemContextMenu
														containerClassName="item-context-menu my-ctx-menu"
														wrapChildren={false}
													>
														{canConfigure && (
															<li>
																<a
																	id="configure-item"
																	href={getConfigureAvatarAssetLink(
																		assetId,
																	)}
																>
																	{getMessage(
																		"item.contextMenu.configure",
																	)}
																</a>
															</li>
														)}
														{reportAbuseUrl && (
															<li>
																<a
																	id="report-item"
																	className="abuse-report-modal"
																	href={reportAbuseUrl}
																>
																	{getMessage(
																		"item.contextMenu.report",
																	)}
																</a>
															</li>
														)}
														{blockedItemsEnabled && (
															<BlockItemButton
																itemType="Asset"
																itemId={assetId}
															/>
														)}
														{copyShareLinksEnabled && (
															<CopyShareLinkButton
																type="Asset"
																id={assetId}
															/>
														)}
														<AddToProfileButton
															itemType="Asset"
															itemId={assetId}
															isHidden
															show={
																!!itemInstances?.data.length &&
																!isModerated
															}
														/>
													</ItemContextMenu>
													{refreshEnabled && (
														<Tooltip
															as="div"
															id="refresh-details-button-container"
															placement="top"
															button={
																<Icon
																	id="refresh-details-button"
																	name="common-refresh"
																	className="rbx-menu-item btn-generic-more-sm"
																	onClick={() => {
																		refetchData();
																		refetchItemInstances();
																	}}
																/>
															}
														>
															{getMessage(
																"avatarItem.refreshDetails",
															)}
														</Tooltip>
													)}
												</div>
											</div>
											<div id="item-details" className="item-details-section">
												<div className="price-row-container">
													<div className="price-container-text">
														{((quantityLimited &&
															!!itemInstances?.data.length) ||
															(!itemInstances?.data.length &&
																!isOnsale)) && (
															<div className="item-first-line">
																{quantityLimited &&
																	!!itemInstances?.data.length &&
																	getMessage(
																		isOnsale
																			? "avatarItem.availableInventory"
																			: "avatarItem.availableInventoryOffSale",
																	)}
																{!itemInstances?.data.length &&
																	!isOnsale &&
																	getMessage(
																		"saleStatus.offsale.long",
																	)}
															</div>
														)}
														{isOnsale && data && (
															<PriceInfo price={price} />
														)}
													</div>
													{quantityLimited &&
														!!itemInstances?.data.length && (
															<Button
																as="a"
																id="edit-avatar"
																href={getEditAvatarLink()}
																type="control"
																width="default"
															>
																<Icon name="nav-charactercustomizer" />
															</Button>
														)}
												</div>
												<ItemField
													title={getMessage("avatarItem.tradable")}
												>
													<div className="field-content text font-body">
														{getMessage(
															`avatarItem.tradable.${isLimited ? "yes" : "no"}`,
														)}
													</div>
												</ItemField>
												<ItemField title={getMessage("item.type")}>
													<div className="field-content text font-body">
														{assetTypeDisplayName}
													</div>
												</ItemField>
												{viewItemTagsEnabled && (
													<ItemTags itemType="Asset" itemId={assetId} />
												)}
												{updatedCreatedEnabled && (
													<UpdatedCreatedField
														itemType="Asset"
														itemId={assetId}
														target="avatarItems"
													/>
												)}
												{productDetailsEnabled && (
													<ItemProductInfo
														itemId={assetId}
														itemType="Asset"
													/>
												)}
												{data.description && (
													<ItemField
														className="roseal-toggle-target"
														title={getMessage("item.description")}
													>
														<ToggleTarget
															containerClassName="row-content"
															includeToggleTarget={false}
														>
															<p
																id="item-details-description"
																className="field-content description-content text font-body"
															>
																{itemMentionsEnabled ? (
																	<MentionLinkify
																		content={data.description}
																	/>
																) : (
																	<Linkify
																		content={data.description}
																	/>
																)}
															</p>
														</ToggleTarget>
													</ItemField>
												)}
											</div>
										</div>
									</div>
								)}
								<li id="favorites-button">
									<FavoriteItemButton
										assetId={assetId}
										canFavorite={canFavorite}
									/>
								</li>
								{showAssetDependenciesEnabled && (
									<AssetDependenciesList
										assetId={assetId}
										isHidden
										showCollapse
									/>
								)}
							</div>
						</div>
					</div>
					{/* @ts-expect-error: Fine */}
				</item-details>
			</div>
		</>
	);
}
