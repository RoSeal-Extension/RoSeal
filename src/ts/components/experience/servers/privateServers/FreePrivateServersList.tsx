import { useState } from "preact/hooks";
import Button from "src/ts/components/core/Button";
import Loading from "src/ts/components/core/Loading";
import { warning } from "src/ts/components/core/systemFeedback/helpers/globalSystemFeedback";
import Thumbnail from "src/ts/components/core/Thumbnail";
import usePages from "src/ts/components/hooks/usePages";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { RESTError } from "src/ts/helpers/requests/main";
import {
	listUserPrivateServers,
	type PrivateServerInventoryItem,
} from "src/ts/helpers/requests/services/inventory";
import { updatePrivateServer } from "src/ts/helpers/requests/services/privateServers";
import { getConfigurePrivateServerLink, getExperienceLink } from "src/ts/utils/links";

export type FreePrivateServersListProps = {
	setEnableCreateButton?: (enable: boolean) => void;
};

export default function FreePrivateServersList({
	setEnableCreateButton,
}: FreePrivateServersListProps) {
	const [disabledIds, setDisabledIds] = useState<readonly number[]>([]);
	const { items, loading } = usePages<
		PrivateServerInventoryItem,
		PrivateServerInventoryItem,
		string
	>({
		paging: {
			method: "infinite",
		},
		pipeline: {
			filter: (item) => item.active === true && item.priceInRobux === null,
		},
		fetchPage: (cursor) =>
			listUserPrivateServers({
				privateServersTab: "MyPrivateServers",
				itemsPerPage: 100,
				cursor,
			}).then((data) => ({
				hasMore: !!data.nextPageCursor,
				nextCursor: data.nextPageCursor ?? undefined,
				items: data.data,
			})),
	});

	return (
		<div className="modal-list-item free-private-servers-deactivate-list">
			<span>{getMessage("experience.servers.deactivatePrivateServerList.body")}</span>
			<ul className="private-servers-list roseal-scrollbar">
				{loading && <Loading />}
				{items.map((item) => {
					const isDisabled = disabledIds.includes(item.privateServerId);

					return (
						<li className="private-server-item" key={item.privateServerId}>
							<div className="private-server-info">
								<div className="experience-details-container">
									<Thumbnail
										containerClassName="game-card-thumb-container"
										request={{
											type: "GameIcon",
											targetId: item.universeId,
											size: "150x150",
										}}
									/>
									<div className="names-container">
										<a
											className="experience-name text-name text-overflow"
											href={getExperienceLink(
												item.placeId,
												item.universeName,
											)}
											target="_blank"
											rel="noreferrer"
										>
											{item.universeName}
										</a>
										<a
											className="private-server-name text-name text-overflow"
											href={getConfigurePrivateServerLink(
												item.privateServerId,
											)}
											target="_blank"
											rel="noreferrer"
										>
											<span className="private-server-name">{item.name}</span>
										</a>
									</div>
								</div>
							</div>
							<div className="private-server-btns">
								<Button
									type={isDisabled ? "secondary" : "alert"}
									onClick={() => {
										updatePrivateServer({
											active: isDisabled,
											privateServerId: item.privateServerId,
										})
											.then(() => {
												if (isDisabled) {
													setDisabledIds((prev) =>
														prev.filter(
															(id) => id !== item.privateServerId,
														),
													);
													setEnableCreateButton?.(disabledIds.length > 1);
												} else {
													setDisabledIds((prev) => [
														...prev,
														item.privateServerId,
													]);
													setEnableCreateButton?.(true);
												}
											})
											.catch((err) => {
												if (
													err instanceof RESTError &&
													err?.errors?.[0].userFacingMessage
												) {
													return warning(err.errors[0].userFacingMessage);
												}
											});
									}}
								>
									{getMessage(
										`experience.servers.deactivatePrivateServerList.item.${isDisabled ? "reactivate" : "deactivate"}`,
									)}
								</Button>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
