import { UNRETRYABLE_STATES } from "../helpers/processors/thumbnailProcessor";
import { renderAvatar, type RenderAvatarRequest } from "../helpers/requests/services/thumbnails";
import { sleep } from "./misc";

export async function tryRenderAvatar(avatarRenderData: RenderAvatarRequest) {
	while (true) {
		const data = await renderAvatar(avatarRenderData);

		if (UNRETRYABLE_STATES.includes(data.state)) {
			return data;
		}

		await sleep(2_000);
	}
}
