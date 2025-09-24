import { useCallback, useState } from "preact/hooks";
import usePromise from "../../hooks/usePromise";
import { createOutfit, getAuthenticatedUserAvatar } from "src/ts/helpers/requests/services/avatar";
import SimpleModal from "../../core/modal/SimpleModal";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import TextInput from "../../core/TextInput";
import { success, warning } from "../../core/systemFeedback/helpers/globalSystemFeedback";
import { sendMessage } from "src/ts/helpers/communication/dom";
import type { RESTError } from "src/ts/helpers/requests/main";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";

export default function CreateCharacterModal() {
	const [name, setName] = useState("");
	const [avatar] = usePromise(getAuthenticatedUserAvatar, []);
	const [show, setShow] = useState(true);

	const disabled = !avatar || !name || !/^[A-Z0-9 ]+$/i.test(name);
	const createCharacter = useCallback(() => {
		if (disabled) {
			return;
		}

		createOutfit({
			name,
			assets: avatar?.assets,
			bodyColor3s: avatar?.bodyColor3s,
			scale: avatar?.scales,
			playerAvatarType: avatar?.playerAvatarType,
		})
			.then(() => {
				success(getMessage("avatar.createCharacter.success"));
				sendMessage("avatar.refreshCharacters", undefined);
			})
			.catch((err: RESTError) => {
				if (err?.errors?.[0]?.code === 4) {
					return warning(getMessage("avatar.createCharacter.errors.invalidName"));
				}
				if (err.errors?.[0].code === 1) {
					return warning(getMessage("avatar.createCharacter.errors.maxCharacters"));
				}
				warning(getMessage("avatar.createCharacter.errors.genericError"));
			});

		setShow(false);
	}, [disabled, name, avatar]);

	return (
		<SimpleModal
			show={show}
			size="sm"
			title={getMessage("avatar.createCharacter.modal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			buttons={[
				{
					type: "neutral",
					text: getMessage("avatar.createCharacter.modal.neutral"),
					onClick: () => setShow(false),
				},
				{
					type: "action",
					text: getMessage("avatar.createCharacter.modal.action"),
					onClick: createCharacter,
					disabled,
				},
			]}
		>
			<div>
				<p className="font-caption-header text-description">
					{getMessage("avatar.createCharacter.modal.body")}
				</p>
				<div className="form-group" id="outfit-name-group">
					<TextInput
						onType={setName}
						onEnter={createCharacter}
						placeholder={getMessage("avatar.createCharacter.modal.placeholder")}
					/>
					<p className="form-control-label font-caption-header">
						{getMessage("avatar.createCharacter.modal.note")}
					</p>
				</div>
			</div>
		</SimpleModal>
	);
}
