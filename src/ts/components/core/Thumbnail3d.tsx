import { useEffect, useRef } from "preact/hooks";
import usePromise from "../hooks/usePromise.ts";
import type {
	Get3dThumbnailResponse,
	RenderAvatarDefinition,
	RenderAvatarResponse,
} from "../../helpers/requests/services/thumbnails.ts";
import { invokeMessage } from "src/ts/helpers/communication/dom.ts";
import classNames from "classnames";
import { tryRender3dAssetThumbnail, tryRender3dUserThumbnail } from "src/ts/utils/assets.ts";
import { tryRenderAvatar } from "src/ts/utils/avatar.ts";
import { httpClient } from "src/ts/helpers/requests/main.ts";

export type Thumbnail3dProps = {
	containerClassName?: string;
	id?: string;
	data:
		| {
				type: "Asset";
				assetId: number;
				refreshId?: number;
		  }
		| {
				type: "AvatarRender";
				data?: RenderAvatarDefinition | null;
				refreshId?: number;
		  }
		| {
				type: "AssetAnimated";
				assetId: number;
				refreshId?: number;
		  }
		| {
				type: "Avatar";
				userId: number;
				refreshId?: number;
		  };
};

export default function Thumbnail3d({
	data,
	containerClassName,
	id = "roseal-thumbnail-3d-container",
}: Thumbnail3dProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const [thumbnail] = usePromise(async () => {
		let res: RenderAvatarResponse | undefined;
		if (data.type !== "AssetAnimated" || ("data" in data && data.data)) {
			if (data.type === "Asset") {
				res = await tryRender3dAssetThumbnail(data.assetId);
			} else if (data.type === "AvatarRender") {
				res = await tryRenderAvatar({
					avatarDefinition: data.data!,
					thumbnailConfig: {
						size: "150x150",
						thumbnailId: 1,
						thumbnailType: "3d",
					},
				});
			} else if (data.type === "Avatar") {
				res = await tryRender3dUserThumbnail(data.userId);
			}
		}

		if (res) {
			if (res.state === "Completed" && res.imageUrl) {
				return {
					...res,
					data: (
						await httpClient.httpRequest({
							url: res.imageUrl,
						})
					).body,
				};
			}

			return res as Get3dThumbnailResponse & { data?: unknown };
		}
	}, [data.type, data.type === "AvatarRender" ? !data.data : undefined, data.refreshId]);

	const setup = () => {
		invokeMessage("setup3DThumbnail", {
			type: data.type === "AssetAnimated" ? "animated" : "regular",
			targetId: "assetId" in data ? data.assetId : 1,
			selector: `#${id}`,
			json: thumbnail,
		});
	};

	useEffect(() => {
		if (!thumbnail) {
			ref.current?.replaceChildren();
		}
		if ((!thumbnail?.data && data.type !== "AssetAnimated") || !ref.current) {
			return;
		}

		ref.current.replaceChildren();
		setup();
	}, [ref.current, thumbnail?.imageUrl]);

	return (
		<span
			id={id}
			className={classNames(containerClassName, "roseal-thumbnail-3d-container", {
				shimmer: !thumbnail,
			})}
			ref={(el) => {
				ref.current = el;
				if ((!thumbnail?.data && data.type !== "AssetAnimated") || !el || ref.current) {
					return;
				}

				setup();
			}}
		/>
	);
}
