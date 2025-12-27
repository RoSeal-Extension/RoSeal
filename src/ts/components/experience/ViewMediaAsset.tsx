import Tooltip from "../core/Tooltip.tsx";
import Icon from "../core/Icon.tsx";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { useEffect, useState } from "preact/hooks";
import { watchAttributes } from "src/ts/helpers/elements.ts";
import { getCreatorStoreAssetLink } from "src/ts/utils/links.ts";

export type ViewMediaAssetProps = {
	carouselContainer: HTMLElement;
	mediaIds: (number | null)[];
};

export default function ViewMediaAsset({ carouselContainer, mediaIds }: ViewMediaAssetProps) {
	const [currentId, setCurrentId] = useState<number>();
	const [show, setShow] = useState(false);

	useEffect(() => {
		const runSetId = () => {
			let index = 0;
			for (const item of carouselContainer.querySelectorAll(".carousel-item")) {
				if (item.matches(".carousel-item-active")) {
					console.log(item, mediaIds, index);

					setShow(true);
					setCurrentId(mediaIds[index]!);
					return;
				}

				index++;
			}

			setShow(false);
		};

		runSetId();
		return watchAttributes(carouselContainer, runSetId, ["class"], undefined, true);
	}, []);

	return (
		<>
			{show && (
				<Tooltip
					containerClassName="btn-view-thumbnail-asset-container"
					placement="top"
					button={
						<a
							className="carousel-controls btn-view-thumbnail-asset"
							href={getCreatorStoreAssetLink(currentId!)}
							target="_blank"
							rel="noreferrer"
						>
							<Icon name="menu-document" />
						</a>
					}
				>
					{getMessage("experience.media.viewAsset")}
				</Tooltip>
			)}
		</>
	);
}
