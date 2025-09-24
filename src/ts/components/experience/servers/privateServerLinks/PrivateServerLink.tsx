import classNames from "classnames";
import { useEffect, useState } from "preact/hooks";
import type { PrivateServerLinkData } from "src/ts/constants/privateServerLinks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getAbsoluteTime, getShortRelativeTime } from "src/ts/helpers/i18n/intlFormats";
import { getPrivateServerData } from "src/ts/helpers/requests/services/join";
import { getPrivateServerStatusByCode } from "src/ts/helpers/requests/services/privateServers";
import { resolveShareLink } from "src/ts/helpers/requests/services/sharelinks";
import { getDeviceMeta } from "src/ts/utils/context";
import { sendJoinPrivateGame } from "src/ts/utils/gameLauncher";
import { tryGetServerJoinData } from "src/ts/utils/joinData";
import { getPrivateServerLink, getPrivateServerLinkV2 } from "src/ts/utils/links";
import Button from "../../../core/Button";
import ItemContextMenu from "../../../core/ItemContextMenu";
import AgentMentionContainer from "../../../core/items/AgentMentionContainer";
import Loading from "../../../core/Loading";
import Tooltip from "../../../core/Tooltip";
import useFeatureValue from "../../../hooks/useFeatureValue";
import type { UserProfileResponse } from "../../../hooks/useProfileData";
import usePromise from "../../../hooks/usePromise";
import RemoveServerLinkModal from "./modals/RemoveServerLinkModal";
import UpdateAddServerLinkModal from "./modals/UpdateAddServerLinkModal";

export type PrivateServerLinkProps = PrivateServerLinkData & {
	id: number;
	placeId: number;
	placeName: string;
	universeId: number;
	servers: PrivateServerLinkData[];
	linkCodeVariant?: 1 | 2;
	ownerDetails?: UserProfileResponse | null;
	remove: () => void;
	update: Parameters<typeof UpdateAddServerLinkModal>[0]["updateOrAdd"];
};

export default function PrivateServerLink({
	id,
	name,
	placeId,
	placeName,
	universeId,
	updated,
	linkCode,
	servers,
	linkCodeVariant,
	ownerId,
	ownerDetails,
	update,
	remove,
}: PrivateServerLinkProps) {
	const [tryResolveOwnerId] = useFeatureValue("privateServerLinksSection.tryResolveOwner", false);
	const [tried, setTried] = useState(false);
	const [data] = usePromise<
		() => Promise<{
			valid: boolean;
			accessCode?: string;
			linkCode?: string;
			ownerId?: number;
		}>,
		unknown
	>(
		() =>
			linkCodeVariant !== 2
				? getPrivateServerStatusByCode({
						placeId,
						placeName,
						privateServerLinkCode: linkCode,
					})
				: resolveShareLink({
						linkType: "Server",
						linkId: linkCode,
					})
						.then((data) => {
							const inviteData = data.privateServerInviteData;
							if (inviteData?.universeId !== universeId) {
								return { valid: false };
							}

							return getPrivateServerStatusByCode({
								placeId,
								placeName,
								privateServerLinkCode: inviteData.linkCode,
							}).then((status) => {
								return {
									...status,
									linkCode: inviteData.linkCode,
									ownerId: inviteData.ownerUserId,
								};
							});
						})
						.catch(() => ({
							valid: false,
						})),
		[],
	);
	const [showRemoveModal, setShowRemoveModal] = useState(false);
	const [showUpdateModal, setShowUpdateModal] = useState(false);

	useEffect(() => {
		if (linkCodeVariant !== 2 && data?.valid && tryResolveOwnerId && !tried) {
			getDeviceMeta().then((deviceMeta) => {
				tryGetServerJoinData(getPrivateServerData, {
					placeId,
					accessCode: data.accessCode!,
					linkCode,
					overrideDeviceType: deviceMeta?.deviceType,
					gameJoinAttemptId: crypto.randomUUID(),
					joinOrigin: "RoSealFetchInfo",
				}).then((data) => {
					const realOwnerId = data?.data?.privateServer?.ownerUserId;

					if (realOwnerId && realOwnerId !== ownerId) {
						update({
							name,
							linkCode,
							linkCodeVariant,
							ownerId: realOwnerId,
						});
					}

					setTried(true);
				});
			});
		}
	}, [data?.valid, tryResolveOwnerId]);

	useEffect(() => {
		if (!data?.valid) {
			return;
		}
		if (ownerId === data.ownerId) {
			return;
		}
		update({
			name,
			linkCode,
			linkCodeVariant,
			ownerId: data?.ownerId,
		});
	}, [data?.ownerId]);

	return (
		<>
			<RemoveServerLinkModal
				show={showRemoveModal}
				hide={() => setShowRemoveModal(false)}
				remove={remove}
			/>
			<UpdateAddServerLinkModal
				id={id}
				show={showUpdateModal}
				hide={() => setShowUpdateModal(false)}
				oldDetails={{
					name,
					linkCode,
					linkCodeVariant,
					updated,
					ownerId,
				}}
				placeId={placeId}
				placeName={placeName}
				universeId={universeId}
				servers={servers}
				updateOrAdd={update}
			/>
			<li className="rbx-private-game-server-item col-md-3 col-sm-4 col-xs-6">
				<div className="card-item">
					<div className="rbx-private-game-server-details game-server-details">
						<div className="section-header">
							<div className="server-owner">
								{ownerDetails ||
								ownerDetails === null ||
								(!tryResolveOwnerId ? !ownerId : tried) ? (
									<AgentMentionContainer
										targetType="User"
										targetId={ownerId ?? 0}
										name={
											ownerDetails?.names.username ??
											getMessage("experience.privateServerLinks.item.noOne")
										}
										hasVerifiedBadge={ownerDetails?.isVerified ?? false}
										useLink={!!ownerId}
										usePlaceholder={!ownerId}
									/>
								) : (
									<Loading size="xs" />
								)}
							</div>
							<span className="font-bold server-name">{name || "\u00A0"}</span>
							<div className="text small server-updated-time">
								{getMessage("experience.privateServerLinks.item.updated", {
									time: (
										<Tooltip
											includeContainerClassName={false}
											button={
												<span title={getAbsoluteTime(updated * 1000)}>
													{getShortRelativeTime(updated * 1000)}
												</span>
											}
										>
											{getAbsoluteTime(updated * 1000)}
										</Tooltip>
									),
								})}
							</div>
							<div
								className={classNames("server-status", {
									"text-error": data?.valid === false,
								})}
							>
								{data ? (
									!data.valid &&
									getMessage("experience.privateServerLinks.item.invalid")
								) : (
									<Loading size="sm" />
								)}
							</div>
							<ItemContextMenu containerClassName="link-menu rbx-private-game-server-menu">
								<button
									type="button"
									onClick={() => {
										let url: URL;
										if (linkCodeVariant === 2) {
											url = new URL(
												getPrivateServerLinkV2(linkCode),
												location.href,
											);
										} else {
											url = new URL(
												getPrivateServerLink(placeId, linkCode, placeName),
												location.href,
											);
										}
										navigator.clipboard.writeText(url.toString());
									}}
								>
									{getMessage(
										"experience.privateServerLinks.item.contextMenu.copyLink",
									)}
								</button>

								<button type="button" onClick={() => setShowUpdateModal(true)}>
									{getMessage(
										"experience.privateServerLinks.item.contextMenu.update",
									)}
								</button>

								<button type="button" onClick={() => setShowRemoveModal(true)}>
									{getMessage(
										"experience.privateServerLinks.item.contextMenu.remove",
									)}
								</button>
							</ItemContextMenu>
						</div>
						{data?.valid === false ? (
							<Button
								size="xs"
								width="full"
								type="alert"
								className="game-server-join-btn game-server-remove-btn"
								onClick={() => setShowRemoveModal(true)}
							>
								{getMessage("experience.privateServerLinks.item.remove")}
							</Button>
						) : (
							<Button
								size="xs"
								width="full"
								type="control"
								className="game-server-join-btn"
								disabled={!data?.valid}
								onClick={() => {
									if (!data?.valid) return;

									sendJoinPrivateGame({
										placeId,
										accessCode: data.accessCode,
										linkCode: data.linkCode,
									});
								}}
							>
								{getMessage("experience.privateServerLinks.item.join")}
							</Button>
						)}
					</div>
				</div>
			</li>
		</>
	);
}
