import type { ParsedChallenge } from "parse-roblox-errors";
import { GENERIC_CHALLENGE_DOM_ID, TWOSV_CHALLENGE_DOM_ID } from "src/ts/constants/dom";

export type RenderGenericChallengeResponse = {
	solved: boolean;
	data?: ParsedChallenge;
};

export type Render2SVChallengeResponse = {
	solved: boolean;
	data?: {
		verificationToken: string;
		rememberDevice?: boolean;
	};
};

export type Challenge2SV = {
	userId: number;
	challengeId: string;
	actionType: string;
};

export function render2SVChallengeInject({
	userId,
	challengeId,
	actionType,
}: Challenge2SV): Promise<Render2SVChallengeResponse> {
	if (!document.body.querySelector(`#${TWOSV_CHALLENGE_DOM_ID}`)) {
		const div = document.createElement("div");
		div.id = TWOSV_CHALLENGE_DOM_ID;
		document.body.append(div);
	}

	return new Promise((resolve) => {
		window.Roblox?.AccountIntegrityChallengeService?.TwoStepVerification?.renderChallenge?.({
			containerId: TWOSV_CHALLENGE_DOM_ID,
			userId,
			challengeId,
			actionType,
			renderInline: false,
			shouldShowRememberDeviceCheckbox: false,
			shouldDynamicallyLoadTranslationResources: false,
			onChallengeCompleted: ({
				verificationToken,
				rememberDevice,
			}: NonNullable<Render2SVChallengeResponse["data"]>) =>
				resolve({
					solved: true,
					data: {
						verificationToken,
						rememberDevice,
					},
				}),
			onChallengeInvalidated: () =>
				resolve({
					solved: false,
				}),
			onModalChallengeAbandoned: () =>
				resolve({
					solved: false,
				}),
		});
	});
}

export function renderGenericChallengeInject(
	data: ParsedChallenge,
): Promise<RenderGenericChallengeResponse> {
	if (!document.body.querySelector(`#${GENERIC_CHALLENGE_DOM_ID}`)) {
		const div = document.createElement("div");
		div.id = GENERIC_CHALLENGE_DOM_ID;
		document.body.append(div);
	}

	return new Promise((resolve) => {
		window.Roblox?.AccountIntegrityChallengeService?.Generic?.interceptChallenge?.({
			challengeTypeRaw: data.challengeType,
			challengeId: data.challengeId,
			challengeMetadataJsonBase64: data.challengeBase64Metadata,
			containerId: GENERIC_CHALLENGE_DOM_ID,
			retryRequest: (challengeId, challengeMetadataJsonBase64) =>
				resolve({
					solved: true,
					data: {
						...data,
						challengeId,
						challengeBase64Metadata: challengeMetadataJsonBase64,
					},
				}),
		}).catch(() =>
			resolve({
				solved: false,
			}),
		);
	});
}
