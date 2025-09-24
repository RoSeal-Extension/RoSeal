import SimpleModal from "src/ts/components/core/modal/SimpleModal";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getRegularTime } from "src/ts/helpers/i18n/intlFormats";
import {
	updatePrivateServer,
	updatePrivateServerSubscription,
} from "src/ts/helpers/requests/services/privateServers";
import { useServersTabContext } from "../ServersTabProvider";
import { warning } from "src/ts/components/core/systemFeedback/helpers/globalSystemFeedback";
import { RESTError } from "src/ts/helpers/requests/main";

export type CancelPrivateServerModalProps = {
	privateServerId: number;
	show: boolean;
	expirationDate: string;
	setOpen: (show: boolean) => void;
	onCancel: () => void;
};

export default function CancelPrivateServerModal({
	privateServerId,
	show,
	expirationDate,
	setOpen,
	onCancel,
}: CancelPrivateServerModalProps) {
	const { privateServerPrice } = useServersTabContext();

	return (
		<SimpleModal
			show={show}
			className="roseal-cancel-private-server-modal"
			title={getMessage("experience.servers.cancelPrivateServerModal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			buttons={[
				{
					type: "neutral",
					text: getMessage(
						`experience.servers.cancelPrivateServerModal.buttons.neutral.${privateServerPrice === 0 ? "free" : "paid"}`,
					),
					onClick: () => setOpen(false),
				},
				{
					type: "action",
					text: getMessage(
						`experience.servers.cancelPrivateServerModal.buttons.action.${privateServerPrice === 0 ? "free" : "paid"}`,
					),
					onClick: () => {
						if (privateServerPrice === 0) {
							updatePrivateServer({
								privateServerId,
								active: false,
							})
								.then(onCancel)
								.catch((err) => {
									if (
										err instanceof RESTError &&
										err?.errors?.[0].userFacingMessage
									) {
										return warning(err.errors[0].userFacingMessage);
									}
								});
						} else {
							updatePrivateServerSubscription({
								privateServerId,
								active: false,
							})
								.then(onCancel)
								.catch((err) => {
									if (
										err instanceof RESTError &&
										err?.errors?.[0].userFacingMessage
									) {
										return warning(err.errors[0].userFacingMessage);
									}
								});
						}
						onCancel();
						setOpen(false);
					},
				},
			]}
		>
			{privateServerPrice === 0
				? getMessage("experience.servers.cancelPrivateServerModal.body.free")
				: getMessage("experience.servers.cancelPrivateServerModal.body.paid", {
						date: getRegularTime(expirationDate),
					})}
		</SimpleModal>
	);
}
