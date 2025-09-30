import { useCallback, useEffect, useState } from "preact/hooks";
import type { ReactAvatarEditorPageAvatar } from "src/ts/pages/inject/www/my/avatar";
import usePromise from "../hooks/usePromise";
import { previewUserLookCreation } from "src/ts/helpers/requests/services/marketplace";
import { addMessageListener } from "src/ts/helpers/communication/dom";
import { RESTError } from "@roseal/http-client/src";
import Button from "../core/Button";
import Tooltip from "../core/Tooltip";
import classNames from "classnames";
import PostAvatarModal from "./modals/PostAvatarModal";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export default function PostAvatarButton() {
	const [showModal, setShowModal] = useState(false);
	const [currentAvatar, setCurrentAvatar] = useState<ReactAvatarEditorPageAvatar>();
	const [lookPreview, lookPreviewFetched, error] = usePromise(() => {
		if (!currentAvatar) return;

		return previewUserLookCreation({
			assets: currentAvatar.assets,
		});
	}, [currentAvatar]);

	useEffect(() => addMessageListener("avatar.avatarUpdated", setCurrentAvatar), []);

	const isRESTError = error && error instanceof RESTError;
	const onClickButton = useCallback(() => {
		if (!lookPreviewFetched || !currentAvatar) return;

		setShowModal((show) => !show);
	}, [error, lookPreview, lookPreviewFetched]);

	if (!currentAvatar || !lookPreviewFetched || (isRESTError && error.errors?.[0].code === 1)) {
		// temp
		if (!currentAvatar) return null;
	}

	const button = (
		<Button
			id="post-avatar-btn"
			className={classNames("pointer-events-all", {
				"has-error": isRESTError,
			})}
			onClick={onClickButton}
			type="secondary"
			disabled={!lookPreviewFetched || error !== undefined}
		>
			{getMessage("avatar.postAvatar.buttonText")}
		</Button>
	);

	if (isRESTError) {
		return (
			<Tooltip
				button={button}
				containerId="post-avatar-btn-container"
				includeContainerClassName={false}
			>
				{error.errors?.[0]?.userFacingMessage ??
					error.errors?.[0]?.message ??
					getMessage("avatar.postAvatar.buttonText.errorTooltip")}
			</Tooltip>
		);
	}

	return (
		<>
			<PostAvatarModal show={showModal} setShow={setShowModal} avatar={currentAvatar} />
			{button}
		</>
	);
}
