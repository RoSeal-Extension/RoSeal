import {
	thumbnailProcessor,
	type ThumbnailRequest,
} from "src/ts/helpers/processors/thumbnailProcessor";
import { httpClient } from "src/ts/helpers/requests/main";
import { arrayBufferToDataURL } from "../base64";

export async function getRoSealNotificationIcon(request: ThumbnailRequest) {
	const thumbnail = await thumbnailProcessor.request(request);

	let dataUrl: string | undefined;
	if (thumbnail.imageUrl) {
		try {
			const body = (
				await httpClient.httpRequest<ArrayBuffer>({
					url: thumbnail.imageUrl,
					expect: "arrayBuffer",
				})
			).body;

			dataUrl = await arrayBufferToDataURL(body, "image/webp");
		} catch {}
	}

	return dataUrl ?? browser.runtime.getURL("img/icon/128.png");
}
