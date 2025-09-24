import { useCallback, useState } from "preact/hooks";
import usePromise from "../../hooks/usePromise";
import { getAuthenticatedUserAvatar, updateOutfit } from "src/ts/helpers/requests/services/avatar";
import SimpleModal from "../../core/modal/SimpleModal";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { success, warning } from "../../core/systemFeedback/helpers/globalSystemFeedback";
import { sendMessage } from "src/ts/helpers/communication/dom";
import type { RESTError } from "src/ts/helpers/requests/main";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";

export type UpdateCharacterModalProps = {
	characterId: number;
};

export default function UpdateCharacterModal({ characterId }: UpdateCharacterModalProps) {
	const [avatar] = usePromise(getAuthenticatedUserAvatar, []);
	const [show, setShow] = useState(true);

	const onUpdate = useCallback(() => {
		updateOutfit({
			outfitId: characterId,
			assets: avatar?.assets,
			bodyColor3s: avatar?.bodyColor3s,
			scale: avatar?.scales,
			playerAvatarType: avatar?.playerAvatarType,
		})
			.then(() => {
				success(getMessage("avatar.updateCharacter.success"));

				setTimeout(() => {
					sendMessage("avatar.refreshCharacters", undefined);
				}, 1_000);
			})
			.catch((err: RESTError) => {
				if (err?.errors?.[0].code === 1) {
					return warning(getMessage("avatar.updateCharacter.errors.invalidCharacter"));
				}

				warning(getMessage("avatar.updateCharacter.errors.genericError"));
			});
		setShow(false);
	}, [avatar, characterId]);

	return (
		<SimpleModal
			show={show}
			title={getMessage("avatar.updateCharacter.modal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			buttons={[
				{
					type: "neutral",
					text: getMessage("avatar.updateCharacter.modal.neutral"),
					onClick: () => setShow(false),
				},
				{
					type: "action",
					text: getMessage("avatar.updateCharacter.modal.action"),
					disabled: !avatar,
					onClick: onUpdate,
				},
			]}
			size="sm"
		>
			{getMessage("avatar.updateCharacter.modal.body")}
		</SimpleModal>
	);
}
