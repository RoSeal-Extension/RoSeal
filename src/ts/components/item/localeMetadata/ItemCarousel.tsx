import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import useFeatureValue from "../../hooks/useFeatureValue.ts";
import type { IntlMediaAsset } from "src/ts/helpers/requests/services/intl.ts";
import { useEffect, useState } from "preact/hooks";
import Thumbnail from "../../core/Thumbnail.tsx";
import Tooltip from "../../core/Tooltip.tsx";
import Icon from "../../core/Icon.tsx";
import useEmblaCarousel from "embla-carousel-react";
import classNames from "classnames";
import { getCreatorStoreAssetLink } from "src/ts/utils/links.ts";

export type LocalizedMetadataCarouselProps = {
	thumbnails: IntlMediaAsset[];
};

export function LocalizedMetadataCarousel({ thumbnails }: LocalizedMetadataCarouselProps) {
	const [easyExperienceAltTextEnabled] = useFeatureValue("easyExperienceAltText", false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [emblaMainRef, emblaMainApi] = useEmblaCarousel({});
	const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
		containScroll: "keepSnaps",
		dragFree: true,
	});

	const onThumbClick = (index: number) => {
		if (!emblaMainApi || !emblaThumbsApi) return;
		emblaMainApi.scrollTo(index);
	};

	const onSelect = () => {
		if (!emblaMainApi || !emblaThumbsApi) return;
		setSelectedIndex(emblaMainApi.selectedScrollSnap());
		emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap());
	};

	useEffect(() => {
		if (!emblaMainApi) return;
		onSelect();

		emblaMainApi.on("select", onSelect).on("reInit", onSelect);
	}, [emblaMainApi, emblaThumbsApi, setSelectedIndex]);

	return (
		<div className="roseal-embla-carousel localized-thumbnails-carousel">
			<div className="carousel-main-viewport" ref={emblaMainRef}>
				<div className="carousel-main-container">
					{thumbnails.map((thumbnail) => {
						const imageId = Number.parseInt(thumbnail.mediaAssetId, 10);

						return (
							<div className="carousel-slide" key={imageId}>
								{easyExperienceAltTextEnabled && thumbnail.mediaAssetAltText && (
									<Tooltip
										containerClassName="btn-control-container btn-alt-text-container text small"
										placement="top"
										button={
											<button type="button" className="btn-control">
												{getMessage("experience.media.altText")}
											</button>
										}
									>
										{thumbnail.mediaAssetAltText}
									</Tooltip>
								)}
								<Tooltip
									containerClassName="btn-control-container btn-view-thumbnail-asset-container"
									placement="top"
									button={
										<a
											className="btn-control"
											href={getCreatorStoreAssetLink(imageId)}
											target="_blank"
											rel="noreferrer"
										>
											<Icon name="menu-document" />
										</a>
									}
								>
									{getMessage("experience.media.viewAsset")}
								</Tooltip>
								<Thumbnail
									containerClassName="carousel-slide-image"
									request={{
										type: "Asset",
										targetId: imageId,
										size: "420x420",
									}}
									altText={thumbnail.mediaAssetAltText}
								/>
							</div>
						);
					})}
				</div>
			</div>

			<div className="carousel-preview-container">
				<div className="carousel-preview-viewport" ref={emblaThumbsRef}>
					<div className="carousel-preview">
						{thumbnails.map((thumbnail, index) => {
							const imageId = Number.parseInt(thumbnail.mediaAssetId, 10);

							return (
								<div
									key={imageId}
									className={classNames("carousel-slide-preview", {
										"is-selected": index === selectedIndex,
									})}
									onClick={() => onThumbClick(index)}
								>
									<Thumbnail
										containerClassName="carousel-slide-preview-image"
										key={imageId}
										request={{
											type: "Asset",
											targetId: imageId,
											size: "420x420",
										}}
										altText={thumbnail.mediaAssetAltText}
									/>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
