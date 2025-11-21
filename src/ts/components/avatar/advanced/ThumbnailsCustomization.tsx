import classNames from "classnames";
import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "preact/hooks";
import { THUMBNAIL_CUSTOMIZATION_LIMITS } from "src/ts/constants/avatar";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	getAvatarThumbnailCustomizations,
	setThumbnailCustomization,
	type ThumbnailCustomization,
} from "src/ts/helpers/requests/services/avatar";
import { userOwnsItem } from "src/ts/helpers/requests/services/inventory";
import { multigetAvatarItems } from "src/ts/helpers/requests/services/marketplace";
import { listAllUserAnimatedAssets } from "src/ts/utils/assets";
import { onWindowRefocus } from "src/ts/utils/dom";
import { getAvatarAssetLink } from "src/ts/utils/links";
import Icon from "../../core/Icon";
import ItemLookup from "../../core/ItemLookup";
import Loading from "../../core/Loading";
import { warning } from "../../core/systemFeedback/helpers/globalSystemFeedback";
import Thumbnail from "../../core/Thumbnail";
import Toggle from "../../core/Toggle";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import usePromise from "../../hooks/usePromise";
import type { AdvancedAvatarViewType } from "../AdvancedCustomizationButton";
import ThumbnailConfigItem from "./ThumbnailConfigItem";
import { getAssetTypeData } from "src/ts/utils/itemTypes";

export type ThumbnailsCustomizationProps = {
	incrementRefreshId: () => void;
	viewType: Exclude<AdvancedAvatarViewType, "AvatarBust">;
};

export const thumbnailConfigFieldNames = ["fieldOfViewDeg", "yRotDeg", "distanceScale"] as const;

export default function ThumbnailsCustomization({
	incrementRefreshId,
	viewType,
}: ThumbnailsCustomizationProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [emotes] = usePromise(
		() => authenticatedUser && listAllUserAnimatedAssets(authenticatedUser.userId),
		[authenticatedUser?.userId],
	);
	const [emoteKeyword, setEmoteKeyword] = useState("");
	const [emoteErrorMessage, setEmoteErrorMessage] = useState("");
	const [isUpdating, setIsUpdating] = useState(false);

	const thumbnailTypeId = viewType === "Avatar" ? 2 : 1;
	const customizationLimit = THUMBNAIL_CUSTOMIZATION_LIMITS[viewType];

	const [
		thumbnailConfigurations,
		,
		thumbnailConfigurationsError,
		refetchThumbnailConfigurations,
		setThumbnailConfigurations,
	] = usePromise(getAvatarThumbnailCustomizations, [], false);
	const thumbnailConfiguration = thumbnailConfigurations?.avatarThumbnailCustomizations.find(
		(item) => item.thumbnailType === thumbnailTypeId,
	) ?? {
		thumbnailType: thumbnailTypeId,
		emoteAssetId: 0,
		camera: {
			distanceScale: -1,
			fieldOfViewDeg: 30,
			yRotDeg: -3,
		},
	};

	const match = useMemo(
		() => emotes && new Fuse(emotes, { keys: ["name"], shouldSort: true }),
		[emotes],
	);

	const results = useMemo(() => {
		if (!emotes || !match) {
			return;
		}

		if (!emoteKeyword) {
			return emotes.slice(0, 9);
		}

		return match
			.search(emoteKeyword, {
				limit: 10,
			})
			.map((item) => item.item);
	}, [emotes, emoteKeyword, match]);

	const [emoteDetail] = usePromise(() => {
		if (!thumbnailConfiguration.emoteAssetId) {
			return;
		}

		const emote = emotes?.find((item) => item.assetId === thumbnailConfiguration.emoteAssetId);
		if (emote) {
			return emote;
		}

		return multigetAvatarItems({
			items: [
				{
					id: thumbnailConfiguration.emoteAssetId,
					itemType: "Asset",
				},
			],
		}).then(
			(data) =>
				data[0] && {
					name: data[0].name,
					assetId: data[0].id,
				},
		);
	}, [thumbnailConfiguration.emoteAssetId, emotes]);

	const updateThumbnailConfigurationLocally = (configuration: ThumbnailCustomization) => {
		setThumbnailConfigurations({
			avatarThumbnailCustomizations: [
				...(thumbnailConfigurations?.avatarThumbnailCustomizations ?? []).filter(
					(item) => item.thumbnailType !== configuration.thumbnailType,
				),
				configuration,
			],
		});
	};

	const updateThumbnailConfiguration = (newConfiguration?: ThumbnailCustomization) => {
		const configuration = newConfiguration ?? thumbnailConfiguration;
		setIsUpdating(true);

		return setThumbnailCustomization(configuration)
			.then(() => {
				if (newConfiguration) {
					updateThumbnailConfigurationLocally(newConfiguration);
				}
				incrementRefreshId();
			})
			.catch(() => warning(getMessage("avatar.advanced.thumbnails.errors.update")))
			.finally(() => setIsUpdating(false));
	};

	useEffect(() => onWindowRefocus(10_000, refetchThumbnailConfigurations), []);

	const isEnabled = thumbnailConfiguration?.camera.distanceScale !== -1;

	return (
		<div
			className={classNames("thumbnail-customization text-emphasis", {
				"roseal-disabled": isUpdating || !thumbnailConfigurations,
			})}
		>
			<div className="top-configurations-container configuration-container">
				<div className="customization-enabled">
					<Toggle
						isOn={isEnabled}
						onToggle={() =>
							updateThumbnailConfiguration({
								...thumbnailConfiguration,
								emoteAssetId: thumbnailConfiguration.emoteAssetId,
								camera: {
									...thumbnailConfiguration.camera,
									distanceScale: isEnabled ? -1 : 1,
								},
							})
						}
					/>
					<span className="customization-enabled-label">
						{getMessage(`avatar.advanced.thumbnails.toggle.${viewType}`)}
					</span>
				</div>
			</div>
			{!thumbnailConfigurationsError ? (
				<div className="bottom-configurations-container configuration-container font-bold">
					<div className="config-section emote-configuration-container">
						<div className="section-label">
							<div className="title-label">
								<span className="title-label-text">
									{getMessage("avatar.advanced.thumbnails.emote")}
								</span>
							</div>
						</div>
						<div
							className={classNames("emote-configuration", {
								"roseal-disabled": !isEnabled && viewType === "AvatarHeadShot",
							})}
						>
							{emoteDetail && (
								<div className="asset-details-container">
									<div className="asset-thumbnail">
										<Thumbnail
											request={{
												targetId: emoteDetail.assetId,
												type: "Asset",
												size: "420x420",
											}}
										/>
									</div>
									<div className="asset-details text-overflow">
										<a
											className="asset-name text-overflow text-link"
											href={getAvatarAssetLink(
												emoteDetail.assetId,
												emoteDetail.name,
											)}
										>
											{emoteDetail.name}
										</a>
									</div>
									<button
										type="button"
										className="remove-item-btn roseal-btn"
										onClick={() => {
											updateThumbnailConfiguration({
												...thumbnailConfiguration,
												emoteAssetId: 0,
											});
										}}
									>
										<Icon name="close" size="16x16" />
									</button>
								</div>
							)}
							{!emoteDetail && !!thumbnailConfiguration.emoteAssetId && <Loading />}
							{!emoteDetail && !thumbnailConfiguration.emoteAssetId && (
								<ItemLookup
									className="assets-lookup"
									items={results?.map((item) => ({
										...item,
										key: item.assetId,
									}))}
									onClick={(item) => {
										setEmoteKeyword("");
										setEmoteErrorMessage("");

										return updateThumbnailConfiguration({
											...thumbnailConfiguration,
											emoteAssetId: item.assetId,
										});
									}}
									render={(item) => {
										return (
											<a
												className="search-result-format"
												href={getAvatarAssetLink(item.assetId, item.name)}
												onClick={(e) => {
													e.preventDefault();
												}}
											>
												<div className="search-result-icon">
													<Thumbnail
														request={{
															type: "Asset",
															targetId: item.assetId,
															size: "75x75",
														}}
													/>
												</div>
												<div className="search-result-detail text-overflow">
													<div className="search-result-name text-overflow text-emphasis">
														{item.name}
													</div>
												</div>
											</a>
										);
									}}
									inputPlaceholder={getMessage(
										emotes
											? "avatar.advanced.thumbnails.setEmote.byName"
											: "avatar.advanced.thumbnails.setEmote.byId",
									)}
									inputClassName="asset-lookup-field"
									onType={(value) => {
										setEmoteKeyword(value);
									}}
									inputValue={emoteKeyword}
									onSubmit={(value) => {
										const assetId = Number.parseInt(value, 10);
										if (!assetId) {
											setEmoteErrorMessage(
												getMessage(
													"avatar.advanced.thumbnails.errors.invalidAssetId",
												),
											);
											return;
										}

										setEmoteKeyword("");

										setIsUpdating(true);
										setEmoteErrorMessage("");
										return multigetAvatarItems({
											items: [
												{
													itemType: "Asset",
													id: assetId,
												},
											],
										})
											.then((data) => {
												const item = data[0];
												if (!item) {
													setEmoteErrorMessage(
														getMessage(
															"avatar.advanced.thumbnails.errors.assetNotFound",
														),
													);
													return;
												}

												const assetType = getAssetTypeData(item.assetType);
												if (!assetType?.isAnimated) {
													setEmoteErrorMessage(
														getMessage(
															"avatar.advanced.thumbnails.errors.assetNotEmote",
														),
													);
													return;
												}

												return userOwnsItem({
													userId: authenticatedUser!.userId,
													itemType: "Asset",
													itemId: assetId,
												}).then((ownsItem) => {
													if (!ownsItem) {
														setEmoteErrorMessage(
															getMessage(
																"avatar.advanced.thumbnails.errors.assetNotOwned",
															),
														);
														return;
													}

													return updateThumbnailConfiguration({
														...thumbnailConfiguration,
														emoteAssetId: assetId,
													});
												});
											})
											.finally(() => {
												setIsUpdating(false);
											});
									}}
								>
									{emoteErrorMessage && (
										<div className="text-error">{emoteErrorMessage}</div>
									)}
								</ItemLookup>
							)}
						</div>
					</div>
					{thumbnailConfigFieldNames.map((item) => (
						<ThumbnailConfigItem
							key={item}
							viewType={viewType}
							name={item}
							isEnabled={isEnabled}
							thumbnailConfiguration={thumbnailConfiguration}
							customizationLimit={customizationLimit}
							updateThumbnailConfiguration={updateThumbnailConfiguration}
							updateThumbnailConfigurationLocally={
								updateThumbnailConfigurationLocally
							}
						/>
					))}
				</div>
			) : (
				<div className="text align-center error-message">
					{getMessage("avatar.advanced.thumbnails.errors.loadConfigs")}
				</div>
			)}
		</div>
	);
}
