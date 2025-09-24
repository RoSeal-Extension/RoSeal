import {
	getMarketplaceItemTags,
	type MarketplaceItemType,
} from "src/ts/helpers/requests/services/marketplace";
import usePromise from "../hooks/usePromise";
import ItemField from "../core/items/ItemField";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type ItemTagsProps = {
	itemId: number;
	itemType: MarketplaceItemType;
};

export default function ItemTags({ itemId, itemType }: ItemTagsProps) {
	const [tags] = usePromise(() => {
		const requestId = `${itemType}Id:${itemId}` as const;

		return getMarketplaceItemTags({ itemIds: [requestId] }).then(
			(data) => data.data[0]?.itemTags,
		);
	}, [itemType, itemId]);

	if (!tags?.length) return null;

	return (
		<ItemField title={getMessage("avatarItem.tags")} id="item-tags-field">
			<div className="row-content">
				<span className="pills-container">
					{tags.map((tag) => (
						<span className="pill font-caption-body text" key={tag.id}>
							{tag.tag.localizedDisplayName}
						</span>
					))}
				</span>
			</div>
		</ItemField>
	);
}
