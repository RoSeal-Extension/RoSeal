import SimpleModal from "src/ts/components/core/modal/SimpleModal";
import RobuxView from "src/ts/components/core/RobuxView";
import { updatePrivateServerSubscription } from "src/ts/helpers/requests/services/privateServers";
import { useServersTabContext } from "../ServersTabProvider";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { RESTError } from "src/ts/helpers/requests/main";
import { warning } from "src/ts/components/core/systemFeedback/helpers/globalSystemFeedback";

export type RenewPrivateServerModalProps = {
	privateServerId: number;
	show: boolean;
	setShow: (open: boolean) => void;
	onRenew: () => void;
};

export default function RenewPrivateServerModal({
	privateServerId,
	show,
	setShow,
	onRenew,
}: RenewPrivateServerModalProps) {
	const { universeName, sellerName, privateServerPrice } = useServersTabContext();

	return (
		<SimpleModal
			show={show}
			className="roseal-renew-private-server-modal"
			title={getMessage("experience.servers.renewPrivateServerModal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			buttons={[
				{
					type: "neutral",
					text: getMessage("experience.servers.renewPrivateServerModal.buttons.neutral"),
					onClick: () => setShow(false),
				},
				{
					type: "action",
					text: getMessage("experience.servers.renewPrivateServerModal.buttons.action"),
					onClick: () => {
						updatePrivateServerSubscription({
							privateServerId,
							active: true,
							price: privateServerPrice ?? undefined,
						})
							.then(onRenew)
							.catch((err) => {
								if (
									err instanceof RESTError &&
									err?.errors?.[0].userFacingMessage
								) {
									return warning(err.errors[0].userFacingMessage);
								}
							});
						setShow(false);
					},
				},
			]}
			footer={getMessage("experience.servers.renewPrivateServerModal.footer")}
		>
			<p className="renew-server-modal-body-text">
				{getMessage("experience.servers.renewPrivateServerModal.body.one", {
					universeName,
					sellerName,
				})}
			</p>
			<p className="renew-server-modal-body-text">
				{getMessage("experience.servers.renewPrivateServerModal.body.two", {
					price: <RobuxView priceInRobux={privateServerPrice} isForSale />,
				})}
			</p>
		</SimpleModal>
	);
}
