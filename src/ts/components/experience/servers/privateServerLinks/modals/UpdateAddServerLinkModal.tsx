import classNames from "classnames";
import { useEffect, useMemo, useState } from "preact/hooks";
import Icon from "src/ts/components/core/Icon";
import AgentMentionContainer from "src/ts/components/core/items/AgentMentionContainer";
import Loading from "src/ts/components/core/Loading";
import SimpleModal from "src/ts/components/core/modal/SimpleModal";
import TextInput from "src/ts/components/core/TextInput";
import UserLookup from "src/ts/components/core/UserLookup";
import useFeatureValue from "src/ts/components/hooks/useFeatureValue";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import {
	MATCH_LINKCODE_V0_REGEX,
	MATCH_LINKCODE_V1_REGEX,
	MATCH_LINKCODE_V2_REGEX,
	MAX_SERVER_NAME_LENGTH,
	type PrivateServerLinkData,
} from "src/ts/constants/privateServerLinks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getPrivateServerStatusByCode } from "src/ts/helpers/requests/services/privateServers";
import { resolveShareLink } from "src/ts/helpers/requests/services/sharelinks";
import { getUserById, type RequestedUser } from "src/ts/helpers/requests/services/users";
import { getPrivateServerLink, getPrivateServerLinkV2 } from "src/ts/utils/links";

export type UpdateAddServerLinkProps = {
	id?: number;
	show: boolean;
	placeId: number;
	placeName: string;
	universeId: number;
	servers: PrivateServerLinkData[];
	initialLinkCode?: string;
	oldDetails?: PrivateServerLinkData;
	hide: (completely?: boolean) => void;
	updateOrAdd: (details: MappedOmit<PrivateServerLinkData, "updated">) => void;
};

export default function UpdateAddServerLinkModal({
	id,
	show,
	placeId,
	placeName,
	universeId,
	servers,
	hide,
	initialLinkCode,
	oldDetails,
	updateOrAdd,
}: UpdateAddServerLinkProps) {
	const getDefaultUrl = () => {
		if (!oldDetails) {
			return "";
		}
		const path =
			oldDetails.linkCodeVariant === 2
				? getPrivateServerLinkV2(oldDetails.linkCode)
				: getPrivateServerLink(placeId, oldDetails.linkCode, placeName);
		try {
			return new URL(path, location.href).toString();
		} catch {
			return path;
		}
	};
	const [tryResolveOwnerId] = useFeatureValue("privateServerLinksSection.tryResolveOwner", false);
	const [newName, setNewName] = useState(oldDetails?.name ?? "");
	const [newLink, setNewLink] = useState(getDefaultUrl);
	const [newOwnerDetails, setNewOwnerDetails] = useState<RequestedUser>();
	const [discardPreviousOwner, setDiscardPreviousOwner] = useState(false);
	const [loading, setLoading] = useState(false);
	const [newLinkError, setNewLinkError] = useState("");
	const showOwner = useMemo(
		() =>
			!tryResolveOwnerId &&
			(!MATCH_LINKCODE_V2_REGEX.test(newLink) ||
				MATCH_LINKCODE_V1_REGEX.test(newLink) ||
				MATCH_LINKCODE_V0_REGEX.test(newLink)),
		[newLink, tryResolveOwnerId],
	);

	useEffect(() => {
		if (show) {
			setNewName(oldDetails?.name ?? "");
			setNewLink(getDefaultUrl());
			setLoading(false);
			setNewLinkError("");
			setNewOwnerDetails(undefined);
			setDiscardPreviousOwner(false);
			if (oldDetails?.ownerId) {
				getUserById({
					userId: oldDetails.ownerId,
				})
					.then(setNewOwnerDetails)
					.catch(() => {});
			}
		}
	}, [show]);

	const prefix = oldDetails ? "updatePrivateServerModal" : "addPrivateServerModal";

	return (
		<SimpleModal
			show={show}
			centerTitle
			dialogClassName="update-add-server-link-modal"
			title={getMessage(`experience.privateServerLinks.${prefix}.title`, {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			buttons={[
				{
					type: "neutral",
					text: getMessage(
						"experience.privateServerLinks.addPrivateServerModal.actions.neutral",
					),
					onClick: () => {
						hide(!initialLinkCode);
					},
				},
				{
					type: "action",
					disabled:
						(!initialLinkCode &&
							!(
								MATCH_LINKCODE_V0_REGEX.test(newLink) ||
								MATCH_LINKCODE_V1_REGEX.test(newLink) ||
								MATCH_LINKCODE_V2_REGEX.test(newLink)
							)) ||
						loading,
					loading,
					text: getMessage(`experience.privateServerLinks.${prefix}.actions.action`),
					onClick: () => {
						if (initialLinkCode) {
							hide(true);
							updateOrAdd({
								name: newName,
								linkCode: initialLinkCode,
								linkCodeVariant: 1,
								ownerId: newOwnerDetails?.id,
							});
						} else {
							setLoading(true);
							const oldFormat =
								newLink.match(MATCH_LINKCODE_V1_REGEX)?.[0] ??
								newLink.match(MATCH_LINKCODE_V0_REGEX)?.[1];
							const newFormat = newLink.match(MATCH_LINKCODE_V2_REGEX)?.[0];
							const newLinkCode = (oldFormat ?? newFormat)!;

							if (oldDetails?.linkCode !== newLinkCode) {
								const duplicateCode = servers.find(
									(server, index) =>
										server.linkCode === newLinkCode && index !== id,
								);
								if (duplicateCode) {
									setLoading(false);
									return setNewLinkError(
										getMessage(
											"experience.privateServerLinks.addPrivateServerModal.linkError.duplicate",
											{
												name: duplicateCode.name,
											},
										),
									);
								}
							}

							if (oldFormat) {
								getPrivateServerStatusByCode({
									placeId,
									placeName,
									privateServerLinkCode: newLinkCode,
								})
									.then((data) => {
										if (!data.valid) {
											return setNewLinkError(
												getMessage(
													"experience.privateServerLinks.addPrivateServerModal.linkError.invalid",
												),
											);
										}

										updateOrAdd({
											name: newName,
											linkCode: newLinkCode,
											linkCodeVariant: 1,
											ownerId:
												discardPreviousOwner || !oldDetails?.ownerId
													? newOwnerDetails?.id
													: oldDetails?.ownerId,
										});
										hide(true);
									})
									.catch(() => {
										setNewLinkError(
											getMessage(
												"experience.privateServerLinks.addPrivateServerModal.linkError.unknown",
											),
										);
									})
									.finally(() => {
										setLoading(false);
									});
							} else {
								resolveShareLink({
									linkType: "Server",
									linkId: newLinkCode,
								})
									.then((data) => {
										if (
											data?.privateServerInviteData?.universeId !== universeId
										) {
											return setNewLinkError(
												getMessage(
													"experience.privateServerLinks.addPrivateServerModal.linkError.invalid",
												),
											);
										}

										updateOrAdd({
											name: newName,
											linkCode: newLinkCode,
											linkCodeVariant: 2,
											ownerId: data.privateServerInviteData.ownerUserId,
										});
										hide(true);
									})
									.catch(() =>
										setNewLinkError(
											getMessage(
												"experience.privateServerLinks.addPrivateServerModal.linkError.invalid",
											),
										),
									)
									.finally(() => {
										setLoading(false);
									});
							}
						}
					},
				},
			]}
		>
			{initialLinkCode && (
				<div className="active-server-link-text text-center">
					{getMessage("experience.privateServerLinks.addPrivateServerModal.fromLink")}
				</div>
			)}
			<div className="flex-center">
				<div
					className={classNames("server-link-config", {
						"show-owner": showOwner,
					})}
				>
					<div className="edit-name edit-field">
						<span className="edit-field-label">
							{getMessage("experience.privateServerLinks.addPrivateServerModal.name")}
						</span>
						<TextInput
							placeholder={getMessage(
								"experience.privateServerLinks.addPrivateServerModal.namePlaceholder",
							)}
							value={newName}
							onType={setNewName}
							maxLength={MAX_SERVER_NAME_LENGTH}
							className="server-name-input"
						/>
						<span className="text small edit-field-length">
							{getMessage(
								"experience.privateServerLinks.addPrivateServerModal.nameLength",
								{
									length: newName.length,
									maxLength: MAX_SERVER_NAME_LENGTH,
								},
							)}
						</span>
					</div>
					{!initialLinkCode && (
						<div className="edit-link edit-field">
							<span className="edit-field-label">
								{getMessage(
									"experience.privateServerLinks.addPrivateServerModal.link",
								)}
							</span>
							<TextInput
								placeholder={`https://${location.hostname}/...`}
								value={newLink}
								className="server-link-input"
								onType={setNewLink}
							/>
						</div>
					)}
					{showOwner && (
						<div className="edit-owner edit-field">
							<span className="edit-field-label">
								{getMessage(
									"experience.privateServerLinks.addPrivateServerModal.owner",
								)}
							</span>
							<div className="owner-details-container">
								{(oldDetails?.ownerId && !discardPreviousOwner) ||
								newOwnerDetails ? (
									newOwnerDetails ? (
										<>
											<AgentMentionContainer
												targetType="User"
												targetId={newOwnerDetails.id}
												name={newOwnerDetails.name}
												hasVerifiedBadge={newOwnerDetails.hasVerifiedBadge}
											/>
											<Icon
												className="remove-owner-btn cursor-pointer"
												name="close"
												size="16x16"
												onClick={() => {
													if (
														oldDetails?.ownerId &&
														!discardPreviousOwner
													) {
														setDiscardPreviousOwner(true);
													}
													setNewOwnerDetails(undefined);
												}}
											/>
										</>
									) : (
										<Loading size="xs" />
									)
								) : (
									<UserLookup updateUser={setNewOwnerDetails} />
								)}
							</div>
							{!newOwnerDetails && (
								<div className="text small edit-field-length">
									{getMessage(
										"experience.privateServerLinks.addPrivateServerModal.optional",
									)}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
			{newLinkError && <div className="text-error text-center">{newLinkError}</div>}
		</SimpleModal>
	);
}
