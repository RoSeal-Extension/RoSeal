import classNames from "classnames";
import type { ComponentChildren, JSX } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import type { ThumbnailState } from "../../helpers/requests/services/thumbnails.ts";
import useThumbnail, { type ThumbnailRequest } from "../hooks/useThumbnail.ts";

export function getThumbnailStateClass(thumbnailState?: ThumbnailState): string | undefined {
	switch (thumbnailState) {
		case "Error":
		case "TemporarilyUnavailable": {
			return "icon-broken";
		}
		case "InReview": {
			return "icon-in-review";
		}
		case "Blocked": {
			return "icon-blocked";
		}
		case "Pending": {
			return "icon-pending";
		}
	}
}

export type ThumbnailProps = {
	data?: {
		imageUrl?: string | null;
		loading?: boolean;
		state: ThumbnailState;
	} | null;
	request?: ThumbnailRequest | null;
	onLoad?: () => void;
	imgClassName?: string;
	containerClassName?: string;
	containerProps?: JSX.HTMLAttributes<HTMLSpanElement>;
	altText?: string;
	placeHolderData?: {
		className: string;
	};
	bypassLoading?: boolean;
	children?: ComponentChildren;
};

export default function Thumbnail({
	request,
	data,
	onLoad,
	imgClassName,
	containerClassName,
	containerProps,
	altText,
	bypassLoading = false,
	placeHolderData,
	children,
}: ThumbnailProps) {
	const [loading, setLoading] = useState(true);
	const [thumbnail, isThumbnailCached, _isPreviousThumbnail] =
		data !== undefined
			? [data, true, false]
			: placeHolderData
				? []
				: useThumbnail(request, undefined, true);
	const [prevThumbnailUrl, setPrevThumbnailUrl] = useState<string | undefined | null>();
	const [isPreviousThumbnail, setIsPreviousThumbnail] = useState(false);

	useEffect(() => {
		if (thumbnail?.imageUrl === prevThumbnailUrl) {
			setIsPreviousThumbnail(false);
		}
		setPrevThumbnailUrl(thumbnail?.imageUrl);
	}, [thumbnail]);

	useEffect(() => {
		if (_isPreviousThumbnail) {
			setIsPreviousThumbnail(true);
		}
	}, [_isPreviousThumbnail]);

	const thumbnailClass = classNames(imgClassName, {
		loading: loading && !(bypassLoading && isThumbnailCached),
	});

	const containerClass = classNames(
		"thumbnail-2d-container",
		"roseal-thumbnail-2d-container",
		containerClassName,
		placeHolderData?.className,
		thumbnail && thumbnail.state !== "Completed"
			? getThumbnailStateClass(thumbnail.state)
			: (thumbnail === null || request === undefined) && data === undefined
				? "icon-broken"
				: undefined,
		{
			"is-prev-thumbnail": isPreviousThumbnail,
			shimmer:
				request === null ||
				data?.loading ||
				(thumbnail === null && data === null) ||
				((thumbnail === undefined || isPreviousThumbnail) &&
					request &&
					!placeHolderData &&
					!data),
		},
	);

	const onImageLoad = useCallback(() => {
		onLoad?.();
		setIsPreviousThumbnail(false);
		setLoading(false);
	}, []);

	return (
		<span {...containerProps} className={containerClass}>
			{!placeHolderData && thumbnail?.state === "Completed" && thumbnail.imageUrl && (
				<img
					className={thumbnailClass}
					src={thumbnail.imageUrl}
					alt={altText}
					title={altText}
					onLoad={onImageLoad}
				/>
			)}
			{children}
		</span>
	);
}
