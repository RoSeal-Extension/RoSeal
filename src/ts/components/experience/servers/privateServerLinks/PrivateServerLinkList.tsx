import { useEffect, useState } from "preact/hooks";
import {
	PRIVATE_SERVER_LINKS_STORAGE_KEY,
	type PrivateServerLinkData,
	type PrivateServerLinksStorageValue,
} from "src/ts/constants/privateServerLinks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	profileProcessor,
	type UserProfileResponse,
} from "src/ts/helpers/processors/profileProcessor";
import Button from "../../../core/Button";
import Icon from "../../../core/Icon";
import Tooltip from "../../../core/Tooltip";
import usePromise from "../../../hooks/usePromise";
import useStorage from "../../../hooks/useStorage";
import ImportServerLinksModal from "./modals/ImportServerLinksModal";
import UpdateAddServerLinkModal from "./modals/UpdateAddServerLinkModal";
import PrivateServer from "./PrivateServerLink";

export type PrivateServerLinkListProps = {
	startLinkCode?: string;
	universeId: number;
	placeId: number;
	placeName: string;
};

export default function PrivateServerLinkList({
	startLinkCode,
	universeId,
	placeId,
	placeName,
}: PrivateServerLinkListProps) {
	const [collapsed, setCollapsed] = useState(false);
	const [seeMore, setSeeMore] = useState(false);

	const [showImportModal, setShowImportModal] = useState(false);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showAddCurrentModal, setShowAddCurrentModal] = useState(startLinkCode !== undefined);

	const [privateServers, setPrivateServers, privateServersRef] =
		useStorage<PrivateServerLinksStorageValue>(PRIVATE_SERVER_LINKS_STORAGE_KEY, {});
	const universePrivateServers = privateServers?.[universeId] ?? {
		data: [],
	};

	const ownerIds: number[] = [];
	for (const item of universePrivateServers.data) {
		if (item.ownerId) {
			ownerIds.push(item.ownerId);
		}
	}

	const [ownersDetails] = usePromise(
		() =>
			profileProcessor
				.requestBatch(
					ownerIds.map((userId) => ({
						userId,
					})),
				)
				.then((data) => {
					const ownersDetails: Record<number, UserProfileResponse> = {};

					for (const item of data) {
						ownersDetails[item.userId] = item;
					}
					return ownersDetails;
				}),
		ownerIds,
	);

	useEffect(() => {
		if (showAddCurrentModal && universePrivateServers.data.length) {
			setShowAddCurrentModal(
				universePrivateServers.data.some((item) => item.linkCode === startLinkCode),
			);
		}
	}, [universePrivateServers.data.length, startLinkCode]);

	const universePrivateServersView = seeMore
		? universePrivateServers.data
		: universePrivateServers.data.slice(0, 4);

	return (
		<>
			<UpdateAddServerLinkModal
				show={showAddModal}
				initialLinkCode={showAddCurrentModal ? startLinkCode : undefined}
				hide={(completely) => {
					if (showAddCurrentModal) {
						setShowAddCurrentModal(false);
					}

					if (!showAddCurrentModal || completely) {
						setShowAddModal(false);
					}
				}}
				placeId={placeId}
				universeId={universeId}
				placeName={placeName}
				servers={universePrivateServers.data}
				updateOrAdd={(privateServer) => {
					setPrivateServers({
						...privateServersRef.current,
						[universeId]: {
							data: [
								...universePrivateServers.data,
								{
									...privateServer,
									updated: Date.now() / 1_000,
								},
							],
						},
					});
				}}
			/>
			<ImportServerLinksModal
				show={showImportModal}
				hide={() => setShowImportModal(false)}
				placeId={placeId}
				placeName={placeName}
				universeId={universeId}
				servers={universePrivateServers.data}
				addPrivateServers={(addPrivateServers) => {
					setPrivateServers({
						...privateServersRef.current,
						[universeId]: {
							data: [...universePrivateServers.data, ...addPrivateServers],
						},
					});
				}}
			/>
			<div id="rbx-private-server-links-list" className="stack">
				<div className="container-header">
					<div>
						<h2 className="server-list-header">
							{getMessage("experience.privateServerLinks.title")}
						</h2>
						<Tooltip button={<Icon name="moreinfo" />}>
							{getMessage("experience.privateServerLinks.titleTooltip")}
						</Tooltip>
						<button
							type="button"
							className="roseal-btn collapse-servers-btn"
							onClick={() => setCollapsed(!collapsed)}
						>
							<Icon name={!collapsed ? "up" : "down"} size="16x16" />
						</button>
					</div>
					{!collapsed && (
						<div className="servers-buttons">
							<Button
								className="add-server-link-btn"
								onClick={() => {
									setShowAddModal(true);
								}}
							>
								{getMessage("experience.privateServerLinks.actions.add")}
							</Button>
							<Button
								type="secondary"
								className="import-server-links-btn"
								onClick={() => {
									setShowImportModal(true);
								}}
							>
								{getMessage("experience.privateServerLinks.actions.import")}
							</Button>
							<Button
								as="a"
								type="secondary"
								className="export-server-links-btn"
								download={`${getMessage(
									"experience.privateServerLinks.exportFileName",
									{
										placeName,
									},
								)}.json`}
								href={`data:application/json;base64,${btoa(
									JSON.stringify({
										...universePrivateServers,
										version: 1,
									}),
								)}`}
								disabled={!universePrivateServers?.data.length}
							>
								{getMessage("experience.privateServerLinks.actions.export")}
							</Button>
						</div>
					)}
				</div>
				{!collapsed &&
					(universePrivateServers?.data.length ? (
						<>
							<ul className="card-list rbx-private-game-server-item-container">
								{universePrivateServersView.map((item, index) => (
									<PrivateServer
										key={item.linkCode}
										id={index}
										placeId={placeId}
										placeName={placeName}
										universeId={universeId}
										servers={universePrivateServers.data}
										ownerDetails={
											item.ownerId
												? // biome-ignore lint/complexity/useOptionalChain: Need to send `null` if failed
													ownersDetails && ownersDetails[item.ownerId]
												: undefined
										}
										remove={() => {
											if (privateServersRef.current) {
												const newData: PrivateServerLinkData[] = [];

												for (const item2 of privateServersRef.current[
													universeId
												].data) {
													if (item.linkCode !== item2.linkCode) {
														newData.push(item2);
													}
												}

												setPrivateServers({
													...privateServersRef.current,
													[universeId]: {
														data: newData,
													},
												});
											}
										}}
										update={(newDetails) => {
											if (privateServersRef.current) {
												const newData: PrivateServerLinkData[] = [];

												for (const item of privateServersRef.current[
													universeId
												].data) {
													if (item.linkCode === newDetails.linkCode) {
														newData.push({
															...newDetails,
															updated: Math.floor(Date.now() / 1000),
														});
													} else {
														newData.push(item);
													}
												}

												setPrivateServers({
													...privateServersRef.current,
													[universeId]: {
														data: newData,
													},
												});
											}
										}}
										{...item}
									/>
								))}
							</ul>
							{universePrivateServers.data.length > 4 && (
								<Button
									type="secondary"
									width="full"
									size="xs"
									onClick={() => setSeeMore(!seeMore)}
								>
									{getMessage(
										`experience.privateServerLinks.see${seeMore ? "Less" : "More"}`,
									)}
								</Button>
							)}
						</>
					) : (
						<div className="section-content-off empty-game-instances-container">
							<p className="no-servers-message">
								{getMessage("experience.privateServerLinks.noServers")}
							</p>
						</div>
					))}
			</div>
		</>
	);
}
