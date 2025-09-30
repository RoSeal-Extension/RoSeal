import type { ReactAvatarEditorPageAvatar } from "src/ts/pages/inject/www/my/avatar";
import SimpleModal from "../../core/modal/SimpleModal";
import { useCallback, useEffect, useState } from "preact/hooks";
import {
	createUserLook,
	type CreateUserLookResponse,
} from "src/ts/helpers/requests/services/marketplace";
import { RESTError } from "@roseal/http-client/src";
import TextInput from "../../core/TextInput";
import { getAvatarLookLink } from "src/ts/utils/links";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";

export type PostAvatarModalProps = {
	show: boolean;
	avatar: ReactAvatarEditorPageAvatar;
	setShow: (value: boolean) => void;
};

export default function PostAvatarModal({ show, avatar, setShow }: PostAvatarModalProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [loading, setLoading] = useState(false);
	const [createdLook, setCreatedLook] = useState<CreateUserLookResponse>();
	const [errorMessage, setErrorMessage] = useState<string>();

	useEffect(() => {
		if (show) {
			setName("");
			setDescription("");
			setCreatedLook(undefined);
			setErrorMessage(undefined);
		}
	}, [show]);

	const onClickAction = useCallback(() => {
		if (createdLook) {
			window.open(getAvatarLookLink(createdLook.id, name), "_blank");
			setShow(false);
			return;
		}

		if (!name || !description) return;

		setErrorMessage(undefined);
		setLoading(true);
		createUserLook({
			name,
			description,
			assets: avatar.assets,
			avatarProperties: {
				playerAvatarType: avatar.avatarType,
				bodyColor3s: avatar.bodyColors,
				scale: {
					bodyType: avatar.scales.bodyType.value / 100,
					// sometimes "depth" is undefined...
					depth: (avatar.scales.depth?.value ?? 100) / 100,
					head: avatar.scales.head.value / 100,
					height: avatar.scales.height.value / 100,
					proportion: avatar.scales.proportion.value / 100,
					width: avatar.scales.width.value / 100,
				},
			},
		})
			.then(setCreatedLook)
			.catch((err) => {
				setErrorMessage(
					(err instanceof RESTError &&
						(err.errors?.[0].userFacingMessage || err.errors?.[0].message)) ||
						getMessage("avatar.postAvatar.modal.footer.errorMessage"),
				);
			})
			.finally(() => setLoading(false));
	}, [avatar, name, description, createdLook]);

	return (
		<SimpleModal
			show={show}
			title={getMessage("avatar.postAvatar.modal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			size="sm"
			buttons={[
				{
					type: "neutral",
					text: getMessage("avatar.postAvatar.modal.buttons.neutral"),
					onClick: () => setShow(false),
				},
				{
					type: "action",
					text: getMessage(
						`avatar.postAvatar.modal.buttons.action.${createdLook ? "posted" : "post"}`,
					),
					loading,
					disabled: !name || !description,
					onClick: onClickAction,
				},
			]}
			footer={errorMessage && <span className="text-error">{errorMessage}</span>}
		>
			<div className="post-avatar-modal">
				{!createdLook && (
					<div className="post-avatar-data">
						<div className="avatar-name">
							<span>{getMessage("avatar.postAvatar.modal.body.post.name")}</span>
							<TextInput onType={setName} value={name} />
						</div>
						<div className="avatar-description">
							<span>
								{getMessage("avatar.postAvatar.modal.body.post.description")}
							</span>
							<TextInput as="textarea" onType={setDescription} value={description} />
						</div>
					</div>
				)}
				{createdLook && (
					<p className="align-center">
						{getMessage("avatar.postAvatar.modal.body.posted")}
					</p>
				)}
			</div>
		</SimpleModal>
	);
}
