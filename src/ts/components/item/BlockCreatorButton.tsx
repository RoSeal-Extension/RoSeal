import { useMemo, useState } from "preact/hooks";
import {
	ALLOWED_ITEMS_STORAGE_KEY,
	BLOCKED_ITEMS_STORAGE_KEY,
	DEFAULT_ALLOWED_ITEMS_STORAGE,
	DEFAULT_BLOCKED_ITEMS_STORAGE,
	type AllowedItemsStorage,
	type BlockedItemsStorage,
} from "src/ts/constants/misc";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import type { Agent } from "src/ts/helpers/requests/services/assets";
import { getRoSealSettingsLink } from "src/ts/utils/links";
import SimpleModal from "../core/modal/SimpleModal";
import useStorage from "../hooks/useStorage";

export type BlockCreatorButtonProps = {
	type: Agent;
	id: number;
};

export default function BlockCreatorButton({ type, id }: BlockCreatorButtonProps) {
	const [blockedItemsData, setBlockedItemsData] = useStorage<BlockedItemsStorage>(
		BLOCKED_ITEMS_STORAGE_KEY,
		DEFAULT_BLOCKED_ITEMS_STORAGE,
	);
	const [allowedItemsData, setAllowedItemsData] = useStorage<AllowedItemsStorage>(
		ALLOWED_ITEMS_STORAGE_KEY,
		DEFAULT_ALLOWED_ITEMS_STORAGE,
	);

	const [showWarning, setShowWarning] = useState<"block" | "allow">();
	const isCreatorBlocked = useMemo(() => {
		return blockedItemsData.creators.some(
			(creator) => creator.id === id && creator.type === type,
		);
	}, [id, type, blockedItemsData]);
	const isCreatorAllowed = useMemo(() => {
		return allowedItemsData.creators.some(
			(creator) => creator.id === id && creator.type === type,
		);
	}, [id, type, allowedItemsData]);

	const toggleBlock = () => {
		setBlockedItemsData({
			...blockedItemsData,
			creators: isCreatorBlocked
				? blockedItemsData.creators.filter(
						(creator) => creator.id !== id || creator.type !== type,
					)
				: blockedItemsData.creators.concat({
						id,
						type,
					}),
		});
	};

	const toggleAllow = () => {
		setAllowedItemsData({
			...allowedItemsData,
			creators: isCreatorAllowed
				? allowedItemsData.creators.filter(
						(creator) => creator.id !== id || creator.type !== type,
					)
				: allowedItemsData.creators.concat({
						id,
						type,
					}),
		});
	};

	const translationPrefix =
		`creator${showWarning === "allow" ? "Allow" : "Block"}Warning` as const;

	return (
		<>
			<SimpleModal
				size="sm"
				title={getMessage(`${translationPrefix}.title`, {
					sealEmoji: SEAL_EMOJI_COMPONENT,
				})}
				centerBody
				show={showWarning !== undefined}
				buttons={[
					{
						type: "neutral",
						text: getMessage(`${translationPrefix}.neutral`),
						onClick: () => {
							setShowWarning(undefined);
						},
					},
					{
						type: "action",
						text: getMessage(`${translationPrefix}.action`),
						onClick: () => {
							setShowWarning(undefined);

							if (showWarning === "block") {
								toggleBlock();
							} else {
								toggleAllow();
							}
						},
					},
				]}
			>
				{getMessage(`${translationPrefix}.body`, {
					settingsLink: (contents: string) => (
						<a
							href={getRoSealSettingsLink(`blocked_items_${showWarning}ed`)}
							target="_blank"
							rel="noreferrer"
							className="text-link"
						>
							{contents}
						</a>
					),
				})}
			</SimpleModal>
			{!isCreatorAllowed && (
				<li id="block-item-creator-btn" className="roseal-menu-item">
					<button
						id="block-creator-btn"
						type="button"
						onClick={() => {
							if (blockedItemsData.creators.length === 0) {
								setShowWarning("block");
							} else {
								toggleBlock();
							}
						}}
					>
						{getMessage(
							isCreatorBlocked ? "creator.unblockItems" : "creator.blockItems",
						)}
					</button>
				</li>
			)}
			{!isCreatorBlocked && (
				<li id="allow-item-creator-btn" className="roseal-menu-item">
					<button
						id="allow-creator-btn"
						type="button"
						onClick={() => {
							if (allowedItemsData.creators.length === 0) {
								setShowWarning("allow");
							} else {
								toggleAllow();
							}
						}}
					>
						{getMessage(
							isCreatorAllowed ? "creator.unallowItems" : "creator.allowItems",
						)}
					</button>
				</li>
			)}
		</>
	);
}
