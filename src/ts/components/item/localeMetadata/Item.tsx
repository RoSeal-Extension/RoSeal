import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import type { LiterallyAnyItemType } from "src/ts/helpers/requests/services/marketplace.ts";
import useFeatureValue from "../../hooks/useFeatureValue.ts";
import type { IntlMediaAsset } from "src/ts/helpers/requests/services/intl.ts";
import Thumbnail from "../../core/Thumbnail.tsx";
import { languageNamesFormat } from "src/ts/helpers/i18n/intlFormats.ts";
import MentionLinkify from "../../core/MentionLinkify.tsx";
import Linkify from "../../core/Linkify.tsx";
import Tooltip from "../../core/Tooltip.tsx";
import Icon from "../../core/Icon.tsx";
import classNames from "classnames";
import { LocalizedMetadataCarousel } from "./ItemCarousel.tsx";
import { getCreatorStoreAssetLink } from "src/ts/utils/links.ts";

export type LocalizedMetadataItemProps = {
	languageCode: string;
	itemType: LiterallyAnyItemType;
	iconImageId?: number;
	name?: string;
	description?: string;
	thumbnails?: IntlMediaAsset[];
};

export function LocalizedMetadataItem({
	languageCode,
	iconImageId,
	name,
	description,
	thumbnails,
	itemType,
}: LocalizedMetadataItemProps) {
	const [isItemMentionsEnabled] = useFeatureValue("formatItemMentions", false);

	return (
		<tr>
			<td className="locale-name-container text">{languageNamesFormat.of(languageCode)}</td>
			<td className="locale-icon-container">
				<div className="locale-icon">
					<Thumbnail
						containerClassName={
							itemType === "Badge" || itemType === "GamePass"
								? "round-item"
								: undefined
						}
						request={
							iconImageId
								? {
										type: "Asset",
										size: "420x420",
										targetId: iconImageId,
									}
								: undefined
						}
					/>
					{!!iconImageId && (
						<Tooltip
							containerClassName="btn-control-container btn-view-icon-asset-container"
							placement="top"
							button={
								<a
									className="btn-control"
									href={getCreatorStoreAssetLink(iconImageId)}
									target="_blank"
									rel="noreferrer"
								>
									<Icon name="menu-document" />
								</a>
							}
						>
							{getMessage("item.contextMenu.viewIconAsset")}
						</Tooltip>
					)}
				</div>
			</td>
			{(name || description) && (
				<td className="locale-name-description-container">
					<div className="locale-name-description">
						<h3 className="locale-name">{name}</h3>

						{description && (
							<div
								className={classNames("locale-description text roseal-scrollbar", {
									"universe-description": itemType === "Universe",
								})}
							>
								{isItemMentionsEnabled ? (
									<MentionLinkify key="mention" content={description} />
								) : (
									<Linkify content={description} key="regular" />
								)}
							</div>
						)}
					</div>
				</td>
			)}
			{thumbnails && (
				<td className="locale-thumbnails-container">
					<LocalizedMetadataCarousel thumbnails={thumbnails} />
				</td>
			)}
		</tr>
	);
}
