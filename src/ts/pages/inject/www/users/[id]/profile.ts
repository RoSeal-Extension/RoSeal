import { setInvokeListener } from "src/ts/helpers/communication/dom";
import { featureValueIsInject, getFeatureValueInject } from "src/ts/helpers/features/helpersInject";
import { hijackRequest, hijackResponse } from "src/ts/helpers/hijack/fetch";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getUserAvatar } from "src/ts/helpers/requests/services/avatar";
import {
	type BatchGetThumbnailsRawResponse,
	renderAvatar,
	type RenderAvatarDefinition,
	type RenderAvatarResponse,
} from "src/ts/helpers/requests/services/thumbnails";
import { getUser3dThumbnailDownloadData } from "src/ts/utils/avatar.inject";
import { getRobloxUrl } from "src/ts/utils/baseUrls";
import { sleep } from "src/ts/utils/misc";
import { USER_PROFILE_REGEX } from "src/ts/utils/regex";

export default {
	id: "user.profile",
	regex: [USER_PROFILE_REGEX],
	fn: ({ regexMatches }) => {
		const profileUserId = Number.parseInt(regexMatches![0]![1], 10);

		if (import.meta.env.TARGET_BASE === "firefox") {
			featureValueIsInject("userProfileDownload3DAvatar", true, () =>
				setInvokeListener("user.avatar.getDownloadUrl", getUser3dThumbnailDownloadData),
			);
		}

		getFeatureValueInject("forceProfileFullBodyAvatarType").then((value) => {
			if (!value?.[0]) return;

			let avatarData: RenderAvatarResponse | undefined;
			let definition: RenderAvatarDefinition | undefined;

			const requestCallback = hijackRequest((req) => {
				if (
					!req.url.startsWith(
						`https://${getRobloxUrl("thumbnails", "/v1/users/avatar-3d")}`,
					)
				) {
					return;
				}

				if (!definition) {
					return new Response(
						JSON.stringify({
							targetId: profileUserId,
							state: "Pending",
							imageUrl: null,
						}),
						{
							headers: {
								"content-type": "application/json",
							},
						},
					);
				}

				return renderAvatar({
					avatarDefinition: definition,
					thumbnailConfig: {
						thumbnailType: "3d",
						thumbnailId: profileUserId,
						size: "420x420",
					},
				}).then((data) => {
					return new Response(JSON.stringify(data), {
						headers: {
							"content-type": "application/json",
						},
					});
				});
			});

			const responseCallback = hijackResponse(async (req, res) => {
				if (!res?.ok || req.url !== `https://${getRobloxUrl("thumbnails", "/v1/batch")}`) {
					return;
				}

				const data = (await res.clone().json()) as BatchGetThumbnailsRawResponse;
				for (const item of data.data) {
					if (item.requestId === `${profileUserId}::Avatar:352x352:webp:regular:`) {
						if (avatarData) {
							item.imageUrl = avatarData.imageUrl;
							item.state = avatarData.state;
						} else {
							item.imageUrl = null;
							item.state = "Pending";
						}
					}
				}

				return new Response(JSON.stringify(data), res);
			});

			getUserAvatar({
				userId: profileUserId,
			}).then((data) => {
				if (data.playerAvatarType === value[1]) {
					let showAnyways = false;
					if (value[1] === "R15") {
						for (let i = 0; i < data.assets.length; i++) {
							const item = data.assets[i];
							if (item.name?.includes("R6")) {
								showAnyways = true;
								data.assets.splice(i, 1);
							}
						}
					}

					if (!showAnyways) {
						requestCallback();
						responseCallback();

						return;
					}
				}

				definition = {
					assets: data.assets,
					bodyColors: {
						headColor: data.bodyColor3s.headColor3,
						torsoColor: data.bodyColor3s.torsoColor3,
						leftArmColor: data.bodyColor3s.leftArmColor3,
						rightArmColor: data.bodyColor3s.rightArmColor3,
						leftLegColor: data.bodyColor3s.leftLegColor3,
						rightLegColor: data.bodyColor3s.rightLegColor3,
					},
					playerAvatarType: {
						playerAvatarType: value[1],
					},
					scales: data.scales,
				} as RenderAvatarDefinition;

				(async () => {
					for (let i = 0; i < 10; i++) {
						const data = await renderAvatar({
							avatarDefinition: definition,
							thumbnailConfig: {
								thumbnailType: "2dWebp",
								thumbnailId: profileUserId,
								size: "352x352",
							},
						});

						if (data.state !== "Pending" || i === 9) {
							avatarData = data;
							break;
						}

						await sleep(500);
					}
				})();
			});
		});
	},
} as Page;
