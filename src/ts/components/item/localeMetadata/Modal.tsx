import type { LiterallyAnyItemType } from "src/ts/helpers/requests/services/marketplace.ts";
import type {
	IntlImage,
	IntlNameDescription,
	IntlThumbnailSet,
} from "src/ts/helpers/requests/services/intl.ts";
import SimpleModal from "../../core/modal/SimpleModal.tsx";
import { useState } from "preact/hooks";
import { LocalizedMetadataItem } from "./Item.tsx";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact.tsx";

export type LocalizedMetadataModalProps = {
	itemType: LiterallyAnyItemType;
	icons: IntlImage[];
	nameDescriptions?: IntlNameDescription[];
	thumbnails?: IntlThumbnailSet[];
};

export function LocalizedMetadataModal({
	itemType,
	icons,
	nameDescriptions,
	thumbnails,
}: LocalizedMetadataModalProps) {
	const [show, setShow] = useState(true);

	return (
		<SimpleModal
			show={show}
			title={getMessage("localizedMetadataModal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			onClose={() => setShow(false)}
			size={thumbnails ? "xl" : "md"}
		>
			<div className="localized-metadata-modal roseal-scrollbar">
				<table className="table table-striped localized-metadata-table">
					<thead>
						<tr>
							<th className="text-label">
								{getMessage("localizedMetadataModal.locale")}
							</th>
							<th className="text-label">
								{getMessage("localizedMetadataModal.icon")}
							</th>
							{nameDescriptions?.length && (
								<th className="text-label">
									{getMessage("localizedMetadataModal.nameDescription")}
								</th>
							)}
							{thumbnails?.length && (
								<th className="text-label">
									{getMessage("localizedMetadataModal.thumbnails")}
								</th>
							)}
						</tr>
					</thead>
					<tbody>
						{icons.map((icon) => {
							const imageId = Number.parseInt(icon.imageId!, 10);
							const nameDescription = nameDescriptions?.find(
								(item) => item.languageCode === icon.languageCode,
							);
							const thumbnail = thumbnails
								?.find((item) => item.languageCode === icon.languageCode)
								?.mediaAssets.filter((asset) => asset.state === "Approved");

							if (
								!imageId &&
								!nameDescription?.name &&
								!nameDescription?.description &&
								!thumbnail
							) {
								return;
							}

							return (
								<LocalizedMetadataItem
									languageCode={icon.languageCode
										.replace("_", "-")
										.replace("cjv", "cn")}
									iconImageId={imageId}
									name={nameDescription?.name}
									description={nameDescription?.description}
									thumbnails={thumbnail}
									itemType={itemType}
									key={icon.languageCode}
								/>
							);
						})}
					</tbody>
				</table>
			</div>
		</SimpleModal>
	);
}
