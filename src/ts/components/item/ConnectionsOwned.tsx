import { useState } from "preact/hooks";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import {
	listItemSocialConnections,
	type MarketplaceItemType,
} from "src/ts/helpers/requests/services/marketplace";
import SimpleModal from "../core/modal/SimpleModal";
import usePromise from "../hooks/usePromise";
import ConnectionOwnedItem from "./ConnectionOwnedItem";

export type ItemConnectionsOwnedProps = {
	itemType: MarketplaceItemType;
	itemId: number;
};

export default function ItemConnectionsOwned({ itemType, itemId }: ItemConnectionsOwnedProps) {
	const [showModal, setShowModal] = useState(false);
	const [shownModalOnce, setShownModalOnce] = useState(false);
	const [data] = usePromise(
		() =>
			listItemSocialConnections({
				entityType: itemType,
				entityId: itemId,
				connectionType: "Friend",
			}),
		[itemId, itemType],
	);

	if (!data?.totalCount) return null;

	return (
		<>
			<button
				type="button"
				className="item-connections-social-count roseal-btn"
				onClick={() => {
					setShowModal(true);
					setShownModalOnce(true);
				}}
			>
				<div className="count-text">
					{getMessage("avatarItem.connectionsOwned.buttonText", {
						count: asLocaleString(data.totalCount),
						countNum: data.totalCount,
					})}
				</div>
			</button>
			<SimpleModal
				title={getMessage("avatarItem.connectionsOwned.modal.title", {
					sealEmoji: SEAL_EMOJI_COMPONENT,
					count: asLocaleString(data.totalCount),
				})}
				onClose={() => setShowModal(false)}
				className="connections-owned-modal roseal-scrollbar"
				size="sm"
				show={showModal}
			>
				<ul className="connection-list">
					{shownModalOnce &&
						data.connections.map((connection) => (
							<ConnectionOwnedItem key={connection.id} connection={connection} />
						))}
				</ul>
			</SimpleModal>
		</>
	);
}
