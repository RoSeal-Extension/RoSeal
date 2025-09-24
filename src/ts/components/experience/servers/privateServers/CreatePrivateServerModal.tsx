import { useEffect, useState } from "preact/hooks";
import RobuxView from "src/ts/components/core/RobuxView";
import TextInput from "src/ts/components/core/TextInput";
import Thumbnail from "src/ts/components/core/Thumbnail";
import SimpleModal from "src/ts/components/core/modal/SimpleModal";
import { MAX_SERVER_NAME_LENGTH } from "src/ts/constants/servers";
import {
	type PlacePrivateServer,
	createPrivateServer,
	updatePrivateServerSubscription,
} from "src/ts/helpers/requests/services/privateServers";
import { getConfigurePrivateServerLink } from "src/ts/utils/links";
import { useServersTabContext } from "../ServersTabProvider";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { RESTError } from "src/ts/helpers/requests/main";
import FreePrivateServersList from "./FreePrivateServersList";
import Toggle from "src/ts/components/core/Toggle";

export type CreatePrivateServerModalProps = {
	show: boolean;
	setShow: (show: boolean) => void;
	onCreate: () => void;
};

export default function CreatePrivateServerModal({
	show,
	setShow,
	onCreate,
}: CreatePrivateServerModalProps) {
	const { universeId, universeName, privateServerPrice, sellerName } = useServersTabContext();
	const [serverName, setServerName] = useState("");
	const [unsubscribeAutomatically, setUnsubscribeAutomatically] = useState(false);
	const [createdServer, setCreatedServer] = useState<PlacePrivateServer>();
	const [wasAbleToUnsubscribe, setWasAbleToUnsubscribe] = useState<boolean>();
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string>();

	const [showFreeServerList, setShowFreeServerList] = useState(false);
	const [hasDisabledAServer, setHasDisabledAServer] = useState(false);

	const translationPrefix =
		`experience.servers.createPrivateServerModal.${createdServer ? "purchaseComplete" : "upsell"}` as const;

	useEffect(() => {
		if (show) {
			setServerName("");
			setErrorMessage(undefined);
			setCreatedServer(undefined);
			setShowFreeServerList(false);
			setHasDisabledAServer(false);
			setUnsubscribeAutomatically(false);
			setWasAbleToUnsubscribe(undefined);
		}
	}, [show]);

	return (
		<SimpleModal
			id="purchase-private-server-modal"
			className="roseal-purchase-private-server-modal"
			title={getMessage(`${translationPrefix}.title`, {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			buttons={[
				{
					type: "neutral",
					text: getMessage(`${translationPrefix}.buttons.neutral`),
					disabled: loading,
					onClick: () => {
						setShow(false);
						if (createdServer) onCreate();
					},
				},
				{
					type: "action",
					text: getMessage(`${translationPrefix}.buttons.action`),
					disabled: !serverName || (showFreeServerList && !hasDisabledAServer),
					loading,
					onClick: () => {
						if (createdServer) {
							location.href = getConfigurePrivateServerLink(
								createdServer.vipServerId,
							);
							setShow(false);
						} else {
							setLoading(true);
							createPrivateServer({
								expectedPrice: privateServerPrice || 0,
								name: serverName,
								universeId,
								isPurchaseConfirmed: true,
							})
								.then((data) => {
									setCreatedServer(data);
									setShowFreeServerList(false);

									if (unsubscribeAutomatically) {
										updatePrivateServerSubscription({
											privateServerId: data.vipServerId,
											active: false,
										})
											.then(() => setWasAbleToUnsubscribe(true))
											.catch(() => setWasAbleToUnsubscribe(false));
									}
								})
								.catch((err) => {
									if (err instanceof RESTError) {
										if (err.errors?.[0].code === 31) {
											setShowFreeServerList(true);
										} else {
											setShowFreeServerList(false);
											setErrorMessage(
												err.errors?.[0].userFacingMessage ??
													err.errors?.[0].message ??
													getMessage(
														`experience.servers.createPrivateServerModal.errors.${err.httpCode === 429 ? "tooManyRequests" : "default"}`,
													),
											);
										}
									}
								})
								.finally(() => {
									setLoading(false);
								});
						}
					},
				},
			]}
			footer={
				<>
					{getMessage("experience.servers.createPrivateServerModal.footer")}
					{errorMessage && <div className="error-message">{errorMessage}</div>}
				</>
			}
			show={show}
		>
			<div className="private-server-purchase">
				<div className="modal-list-item private-server-main-text">
					<span>
						{createdServer
							? getMessage(
									"experience.servers.createPrivateServerModal.purchaseComplete.body",
									{
										isMonthly: privateServerPrice !== 0,
										universeName,
										sellerName,
										price: (
											<RobuxView
												priceInRobux={privateServerPrice}
												isForSale
											/>
										),
									},
								)
							: getMessage(
									"experience.servers.createPrivateServerModal.upsell.body",
									{
										price: (
											<RobuxView
												priceInRobux={privateServerPrice}
												isForSale
											/>
										),
										isMonthly: privateServerPrice !== 0,
									},
								)}
					</span>
				</div>
				{wasAbleToUnsubscribe !== undefined && (
					<div className="modal-list-item private-server-main-text">
						<span>
							{getMessage(
								`experience.servers.createPrivateServerModal.purchaseComplete.${wasAbleToUnsubscribe ? "unsubscribeCompleted" : "unsubscribeFailed"}`,
							)}
						</span>
					</div>
				)}
				{!createdServer && (
					<>
						<div className="modal-list-item">
							<span className="text-label private-server-game-name">
								{getMessage(
									"experience.servers.createPrivateServerModal.upsell.body.experienceName",
								)}
							</span>
							<span className="game-name">{universeName}</span>
						</div>
						<div className="modal-list-item private-server-name-input">
							<span className="text-label">
								{getMessage(
									"experience.servers.createPrivateServerModal.upsell.body.serverName",
								)}
							</span>
							<div className="form-group form-has-feedback">
								<TextInput
									className="private-server-name"
									id="private-server-name-text-box"
									value={serverName}
									onType={setServerName}
									maxLength={MAX_SERVER_NAME_LENGTH}
								/>
								<p className="form-control-label text-secondary">
									{getMessage(
										"experience.servers.createPrivateServerModal.upsell.body.serverNameLength",
										{
											length: asLocaleString(serverName.length),
											maxLength: asLocaleString(MAX_SERVER_NAME_LENGTH),
										},
									)}
								</p>
							</div>
						</div>
						{privateServerPrice !== 0 && privateServerPrice !== null && (
							<div className="modal-list-item private-server-unsubscribe-automatically-input">
								<span className="text-label">
									{getMessage(
										"experience.servers.createPrivateServerModal.upsell.body.unsubscribeAutomatically",
									)}
								</span>
								<div className="form-group form-has-feedback">
									<Toggle
										isOn={unsubscribeAutomatically}
										onToggle={setUnsubscribeAutomatically}
									/>
								</div>
							</div>
						)}
					</>
				)}
				<div className="modal-image-container">
					<Thumbnail
						altText={universeName}
						containerClassName="modal-thumb"
						request={{
							type: "GameIcon",
							targetId: universeId,
							size: "150x150",
						}}
					/>
				</div>
				{showFreeServerList && (
					<FreePrivateServersList setEnableCreateButton={setHasDisabledAServer} />
				)}
				{privateServerPrice !== 0 && (
					<p className="rbx-private-server-renewal-disclosure">
						{getMessage(
							"experience.servers.createPrivateServerModal.renewalDisclosure",
						)}
					</p>
				)}
			</div>
		</SimpleModal>
	);
}
