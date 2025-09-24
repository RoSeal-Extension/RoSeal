import { useMemo } from "preact/hooks";
import {
	ALLOWED_ITEMS_STORAGE_KEY,
	type AllowedItemsStorage,
	BLOCKED_ITEMS_STORAGE_KEY,
	type BlockedItemsStorage,
	DEFAULT_ALLOWED_ITEMS_STORAGE,
	DEFAULT_BLOCKED_ITEMS_STORAGE,
} from "src/ts/constants/misc";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { multigetAvatarItems } from "src/ts/helpers/requests/services/marketplace";
import { multigetUniversesByIds } from "src/ts/helpers/requests/services/universes";
import { isAvatarItemBlocked, isExperienceBlocked } from "src/ts/utils/blockedItems";
import usePromise from "../hooks/usePromise";
import useStorage from "../hooks/useStorage";
import type { ItemBlockedScreenProps } from "./ItemBlockedScreen";

export default function BlockItemButton({ itemId, itemType }: ItemBlockedScreenProps) {
	const [blockedItemsData, setBlockedItemsData] = useStorage<BlockedItemsStorage>(
		BLOCKED_ITEMS_STORAGE_KEY,
		DEFAULT_BLOCKED_ITEMS_STORAGE,
	);
	const [allowedItemsData, setAllowedItemsData] = useStorage<AllowedItemsStorage>(
		ALLOWED_ITEMS_STORAGE_KEY,
		DEFAULT_ALLOWED_ITEMS_STORAGE,
	);

	const isExplicitlyBlocked = useMemo(() => {
		if (itemType === "Universe") {
			return blockedItemsData.experiences.ids.includes(itemId);
		}

		return blockedItemsData.items.items.some(
			(item) => item.id === itemId && item.type === itemType,
		);
	}, [itemId, itemType, blockedItemsData]);
	const [isBlocked] = usePromise(() => {
		if (itemType === "Universe") {
			return multigetUniversesByIds({
				universeIds: [itemId],
			}).then((data) => {
				const item = data[0];

				return isExperienceBlocked(
					itemId,
					item.creator.type,
					item.creator.id,
					item.name,
					item.description,
				);
			});
		}

		return multigetAvatarItems({
			items: [
				{
					itemType,
					id: itemId,
				},
			],
		}).then((data) => {
			const item = data[0];

			return isAvatarItemBlocked(
				itemId,
				itemType,
				item.creatorType,
				item.creatorTargetId,
				item.name,
				item.description,
			);
		});
	}, [itemId, itemType, blockedItemsData, allowedItemsData]);
	const isExplicitlyAllowed = useMemo(() => {
		if (itemType === "Universe") {
			return allowedItemsData.experiences.ids.includes(itemId);
		}

		return allowedItemsData.items.items.some(
			(item) => item.id === itemId && item.type === itemType,
		);
	}, [itemId, itemType, allowedItemsData]);

	const toggleBlock = () => {
		if (itemType === "Universe") {
			setBlockedItemsData({
				...blockedItemsData,
				experiences: {
					...blockedItemsData.experiences,
					ids: isExplicitlyBlocked
						? blockedItemsData.experiences.ids.filter((id) => id !== itemId)
						: blockedItemsData.experiences.ids.concat(itemId),
				},
			});
		} else {
			setBlockedItemsData({
				...blockedItemsData,
				items: {
					...blockedItemsData.items,
					items: isExplicitlyBlocked
						? blockedItemsData.items.items.filter(
								(item) => item.id !== itemId || item.type !== itemType,
							)
						: blockedItemsData.items.items.concat({
								id: itemId,
								type: itemType,
							}),
				},
			});
		}
	};

	const toggleAllow = () => {
		if (itemType === "Universe") {
			setAllowedItemsData({
				...allowedItemsData,
				experiences: {
					...allowedItemsData.experiences,
					ids: isExplicitlyAllowed
						? allowedItemsData.experiences.ids.filter((id) => id !== itemId)
						: allowedItemsData.experiences.ids.concat(itemId),
				},
			});
		} else {
			setAllowedItemsData({
				...allowedItemsData,
				items: {
					...allowedItemsData.items,
					items: isExplicitlyAllowed
						? allowedItemsData.items.items.filter(
								(item) => item.id !== itemId || item.type !== itemType,
							)
						: allowedItemsData.items.items.concat({
								id: itemId,
								type: itemType,
							}),
				},
			});
		}
	};

	return (
		<>
			<li id="block-item-li">
				<button id="block-item-btn" type="button" onClick={toggleBlock}>
					{getMessage(isExplicitlyBlocked ? "item.unblock" : "item.block")}
				</button>
			</li>
			{(isExplicitlyAllowed || (isBlocked && !isExplicitlyBlocked)) && (
				<li id="allow-item-li">
					<button id="allow-item-btn" type="button" onClick={toggleAllow}>
						{getMessage(isExplicitlyAllowed ? "item.unallow" : "item.allow")}
					</button>
				</li>
			)}
		</>
	);
}
