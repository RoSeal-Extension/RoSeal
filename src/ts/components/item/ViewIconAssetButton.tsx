import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { getAssetById } from "src/ts/helpers/requests/services/assets.ts";
import type { LiterallyAnyItemType } from "src/ts/helpers/requests/services/marketplace.ts";
import { getPassProductById } from "src/ts/helpers/requests/services/passes.ts";
import usePromise from "../hooks/usePromise.ts";
import { getBadgeById } from "src/ts/helpers/requests/services/badges.ts";
import { getGroupByIdLegacy } from "src/ts/helpers/requests/services/groups.ts";
import { CONTENT_ID_REGEX } from "src/ts/utils/assets.ts";
import useFeatureValue from "../hooks/useFeatureValue.ts";
import {
	listBadgeIntlIcons,
	listBadgeIntlNameDescription,
	listDeveloperProductIntlIcons,
	listDeveloperProductIntlNameDescription,
	listPassIntlIcons,
	listPassIntlNameDescription,
	listUniverseIntlIcons,
	listUniverseIntlNameDescription,
	listUniverseIntlThumbnails,
} from "src/ts/helpers/requests/services/intl.ts";
import { renderAppendBody } from "src/ts/utils/render.ts";
import { LocalizedMetadataModal } from "./localeMetadata/Modal.tsx";
import { getCreatorStoreAssetLink } from "src/ts/utils/links.ts";

export type ViewIconAssetProps = {
	itemId: number;
	itemType: LiterallyAnyItemType;
	iconAssetId?: number;
};

export default function ViewIconAssetButton({
	itemId,
	itemType,
	iconAssetId: setIconAssetId,
}: ViewIconAssetProps) {
	const [viewIntlMediaEnabled] = useFeatureValue("viewItemMedia.intlMedia", false);
	const [thumbnails] = usePromise(() => {
		if (itemType !== "Universe" || !viewIntlMediaEnabled) {
			return;
		}

		return listUniverseIntlThumbnails({
			universeId: itemId,
		}).then((data) => data.data);
	}, [viewIntlMediaEnabled, itemId, itemType]);
	const [icons] = usePromise(() => {
		if (!viewIntlMediaEnabled) {
			return;
		}

		if (itemType === "GamePass") {
			return listPassIntlIcons({
				passId: itemId,
			}).then((data) => data.data);
		}

		if (itemType === "DeveloperProduct") {
			return listDeveloperProductIntlIcons({
				developerProductId: itemId,
			}).then((data) => data.data);
		}

		if (itemType === "Badge") {
			return listBadgeIntlIcons({
				badgeId: itemId,
			}).then((data) => data.data);
		}

		if (itemType === "Universe") {
			return listUniverseIntlIcons({
				universeId: itemId,
			}).then((data) => data.data);
		}
	}, [viewIntlMediaEnabled, itemId, itemType]);

	const [iconAssetId] = usePromise(() => {
		if (setIconAssetId) {
			return setIconAssetId;
		}

		if (itemType === "Group") {
			return getGroupByIdLegacy({
				groupId: itemId,
			}).then((data) => {
				const url = data?.emblemUrl;
				if (!url) {
					return;
				}

				const match = url.match(CONTENT_ID_REGEX)?.[4];
				if (!match) return;

				return Number.parseInt(match, 10);
			});
		}

		if (itemType === "Asset") {
			return getAssetById({
				assetId: itemId,
			}).then((data) => data.iconImageAssetId);
		}

		if (viewIntlMediaEnabled) {
			return;
		}

		if (itemType === "GamePass") {
			return getPassProductById({
				passId: itemId,
			}).then((data) => data.iconImageAssetId);
		}

		if (itemType === "Badge") {
			return getBadgeById({
				badgeId: itemId,
			}).then((data) => data.displayIconImageId);
		}

		if (itemType === "Universe") {
			return listUniverseIntlIcons({
				universeId: itemId,
			}).then((data) => {
				const imageId = data.data[0].imageId;
				if (imageId) {
					return Number.parseInt(imageId, 10);
				}
			});
		}
	}, [itemId, itemType, setIconAssetId, viewIntlMediaEnabled]);

	const [nameDescriptions] = usePromise(() => {
		if (!viewIntlMediaEnabled) {
			return;
		}

		if (itemType === "Universe") {
			return listUniverseIntlNameDescription({
				universeId: itemId,
			}).then((data) => data.data);
		}

		if (itemType === "Badge") {
			return listBadgeIntlNameDescription({
				badgeId: itemId,
			}).then((data) => data.data);
		}

		if (itemType === "GamePass") {
			return listPassIntlNameDescription({
				passId: itemId,
			}).then((data) => data.data);
		}

		if (itemType === "DeveloperProduct") {
			return listDeveloperProductIntlNameDescription({
				developerProductId: itemId,
			}).then((data) => data.data);
		}
	}, [itemId, itemType, viewIntlMediaEnabled]);

	return (
		<>
			{!!iconAssetId && (
				<li id="view-icon-asset-li" className="roseal-menu-item">
					<a id="view-icon-asset-btn" href={getCreatorStoreAssetLink(iconAssetId)}>
						{getMessage("item.contextMenu.viewIconAsset")}
					</a>
				</li>
			)}
			{!!icons?.length &&
				!!nameDescriptions?.length &&
				(itemType !== "Universe" || !!thumbnails?.length) && (
					<li id="view-metadata-li" className="roseal-menu-item">
						<button
							type="button"
							id="view-metadata-btn"
							onClick={() => {
								renderAppendBody(
									<LocalizedMetadataModal
										itemType={itemType}
										icons={icons}
										nameDescriptions={nameDescriptions ?? undefined}
										thumbnails={thumbnails ?? undefined}
									/>,
								);
							}}
						>
							{getMessage("item.contextMenu.viewMetadata")}
						</button>
					</li>
				)}
		</>
	);
}
