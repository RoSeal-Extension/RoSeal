import { useEffect, useMemo, useState } from "preact/hooks";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getLayersValues } from "src/ts/helpers/requests/services/testService";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import { getDeviceMeta } from "src/ts/utils/context";
import { getPlaceLauncherData } from "src/ts/utils/context";
import Icon from "../core/Icon";
import Tooltip from "../core/Tooltip";
import SimpleModal from "../core/modal/SimpleModal";
import usePromise from "../hooks/usePromise";
import { getUserAccountIdBTID } from "src/ts/utils/cookies";

export default function RobloxSessionModal() {
	const [showModal, setShowModal] = useState(false);
	const [deviceMeta] = usePromise(getDeviceMeta);
	const [placeLauncherData] = usePromise(getPlaceLauncherData);
	const [platformData, setPlatformData] = useState<[string, number]>();
	const userAccountId = useMemo(() => getUserAccountIdBTID()?.[0], []);
	const [authenticatedUser] = usePromise(getAuthenticatedUser);

	useEffect(() => {
		if (!platformData && showModal) {
			getLayersValues({
				layers: {
					PlaceholderLayer: {},
				},
			}).then((data) => setPlatformData([data.platformType, data.platformTypeId]));
		}
	}, [showModal]);

	return (
		<div id="roblox-session-metadata">
			<Tooltip button={<Icon name="moreinfo" onClick={() => setShowModal(true)} />}>
				<span>{getMessage("sessionMetadata.buttonText")}</span>
			</Tooltip>
			<SimpleModal
				id="roblox-session-metadata-modal"
				show={showModal}
				size="md"
				onClose={() => setShowModal(false)}
				title={getMessage("sessionMetadata.modal.title", {
					sealEmoji: SEAL_EMOJI_COMPONENT,
				})}
			>
				<ul className="metadata-list">
					{[
						deviceMeta?.deviceType && [
							getMessage("sessionMetadata.modal.deviceType"),
							deviceMeta.deviceType,
						],
						placeLauncherData?.osName &&
							platformData && [
								getMessage("sessionMetadata.modal.platformType"),
								getMessage("sessionMetadata.modal.platformType.value", {
									osName: placeLauncherData.osName,
									platformType: platformData[0],
									platformTypeId: platformData[1],
								}),
							],
						deviceMeta?.viewType &&
							deviceMeta?.appType && [
								getMessage("sessionMetadata.modal.viewType"),
								getMessage("sessionMetadata.modal.viewType.value", {
									viewType: deviceMeta.viewType,
									appType: deviceMeta.appType,
								}),
							],
						placeLauncherData?.playerChannelName && [
							getMessage("sessionMetadata.modal.playerChannel"),
							placeLauncherData.playerChannelName,
						],
						placeLauncherData?.studioChannelName && [
							getMessage("sessionMetadata.modal.studioChannel"),
							placeLauncherData.studioChannelName,
						],
						placeLauncherData?.accountChannelName && [
							getMessage("sessionMetadata.modal.legacyChannel"),
							placeLauncherData.accountChannelName,
						],
						authenticatedUser?.userId && [
							getMessage("sessionMetadata.modal.userId"),
							authenticatedUser.userId,
						],
						userAccountId && [
							getMessage("sessionMetadata.modal.accountId"),
							userAccountId,
							getMessage("sessionMetadata.modal.accountId.tooltip"),
						],
					].map(
						(item) =>
							item && (
								<li className="list-item" key={item[0]}>
									<div className="text-emphasis item-label">
										<span>{item[0]}</span>
										{item[2] && (
											<Tooltip
												button={
													<Icon
														name="moreinfo"
														size="16x16"
														addSizeClass
													/>
												}
											>
												{item[2]}
											</Tooltip>
										)}
									</div>
									<div className="item-text">{item[1]}</div>
								</li>
							),
					)}
				</ul>
			</SimpleModal>
		</div>
	);
}
