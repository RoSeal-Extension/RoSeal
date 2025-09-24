import { useEffect, useMemo, useState } from "preact/hooks";
import {
	type ThumbnailItem,
	thumbnailProcessor,
	type ThumbnailRequest,
} from "../../helpers/processors/thumbnailProcessor";
import useFeatureValue from "./useFeatureValue";

export default function useThumbnail(
	_request?: ThumbnailRequest | null,
	inputs?: unknown[],
	usePreviousThumbnail = false,
): [ThumbnailItem | undefined | null, boolean, boolean] {
	const [avatarHeadshotOverride] = useFeatureValue("userAvatarHeadshotOverride", [
		false,
		"AvatarBust",
	]);

	const request = useMemo(() => {
		if (avatarHeadshotOverride?.[0] && _request?.type === "AvatarHeadShot") {
			return {
				..._request,
				type: avatarHeadshotOverride[1],
			};
		}

		return _request;
	}, [_request, avatarHeadshotOverride]);
	const [thumbnail, setThumbnail] = useState<ThumbnailItem | null | undefined>(
		request && thumbnailProcessor.getIfCached(request),
	);
	const [isCached, setIsCached] = useState(
		request ? thumbnailProcessor.isCached(request) : false,
	);
	const [isPreviousThumbnail, setIsPreviousThumbnail] = useState(false);

	useEffect(() => {
		if (request && thumbnail) {
			const removeOnChanged = thumbnailProcessor.onChanged(request, (thumbnail) => {
				setThumbnail(thumbnail);
				setIsCached(thumbnail.fromCache === true);
			});
			const removeOnPreparingNextRequest = usePreviousThumbnail
				? thumbnailProcessor.onPreparingNextRequest(request, () => {
						setIsPreviousThumbnail(true);
					})
				: undefined;

			return () => {
				removeOnChanged();
				removeOnPreparingNextRequest?.();
			};
		}
	}, [request, !!thumbnail, usePreviousThumbnail]);

	useEffect(() => {
		if (!usePreviousThumbnail || !request) {
			setThumbnail(undefined);
			if (!request) {
				return;
			}
		}

		if (usePreviousThumbnail && thumbnail) {
			setIsPreviousThumbnail(true);
		}

		setIsCached(thumbnailProcessor.isCached(request));

		let cancelled = false;
		thumbnailProcessor
			.request(request)
			.then((data) => {
				if (!cancelled) {
					setThumbnail(data);
					setIsPreviousThumbnail(false);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setThumbnail(null);
					setIsPreviousThumbnail(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [
		...(inputs ?? []),
		request?.alias,
		request?.format,
		request?.isCircular,
		request?.size,
		request?.targetId,
		request?.token,
		request?.type,
		request?.refreshId,
	]);

	return [thumbnail, isCached, isPreviousThumbnail];
}

export type { ThumbnailItem, ThumbnailRequest };
