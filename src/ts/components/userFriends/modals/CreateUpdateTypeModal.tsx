import emojiRegexFn from "emoji-regex";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import {
	type ConnectionType,
	DEFAULT_CONNECTION_TYPE_COLOR,
	MAX_CONNECTION_TYPE_DESCRIPTION_LENGTH,
	MAX_CONNECTION_TYPE_NAME_LENGTH,
} from "src/ts/constants/friends";
import SimpleModal from "../../core/modal/SimpleModal";
import TextInput from "../../core/TextInput";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { getOSType } from "src/ts/utils/context";
import { SYMBOL_REGEX } from "src/ts/utils/regex";

export type CreateConnectionTypeModalProps = {
	show: boolean;
	data?: ConnectionType;
	close: () => void;
	updateItem: (data: Partial<ConnectionType>) => void;
	createItem: (data: ConnectionType) => void;
	deleteItem: () => void;
};

export default function CreateConnectionTypeModal({
	data,
	show,
	close,
	updateItem,
	createItem,
	deleteItem,
}: CreateConnectionTypeModalProps) {
	const [name, setName] = useState(data?.name ?? "");
	const [description, setDescription] = useState(data?.description ?? "");
	const [emoji, setEmoji] = useState(data?.emojiText ?? "");
	const [color, setColor] = useState(data?.color ?? DEFAULT_CONNECTION_TYPE_COLOR);

	useEffect(() => {
		if (!data && !show) return;

		setName(data?.name ?? "");
		setDescription(data?.description ?? "");
		setEmoji(data?.emojiText ?? "");
		setColor(data?.color ?? DEFAULT_CONNECTION_TYPE_COLOR);
	}, [data?.color, data?.name, data?.emojiText, data?.description, show]);

	const emojiRegex = useMemo(emojiRegexFn, []);
	const emojiHint = useMemo(() => {
		if (import.meta.env.TARGET_BASE === "chromium") {
			return getMessage("friends.types.createUpdateModal.emoji.hint.chrome");
		}

		return getMessage(`friends.types.createUpdateModal.emoji.hint.${getOSType()}`);
	}, []);
	const checkEmoji = useCallback(
		(str: string) => {
			if (!str) return true;

			emojiRegex.lastIndex = 0;
			const isMatch = emojiRegex.test(str);
			// Ensure the match covers the entire string and no more matches exist
			return (
				(isMatch && emojiRegex.lastIndex === str.length && !emojiRegex.test(str)) ||
				SYMBOL_REGEX.test(str)
			);
		},
		[emojiRegex],
	);

	return (
		<SimpleModal
			title={getMessage(
				`friends.types.createUpdateModal.title.${data ? "update" : "create"}`,
				{
					sealEmoji: SEAL_EMOJI_COMPONENT,
				},
			)}
			show={show}
			onClose={close}
			size="sm"
			centerBody="flex"
			buttons={[
				{
					type: "neutral",
					text: getMessage("friends.types.createUpdateModal.buttons.neutral"),
					onClick: close,
				},
				{
					type: "action",
					buttonType: "alert",
					text: getMessage("friends.types.createUpdateModal.buttons.delete"),
					visible: data !== undefined,
					onClick: () => {
						close();
						deleteItem();
					},
				},
				data
					? {
							type: "action",
							text: getMessage("friends.types.createUpdateModal.buttons.save"),
							disabled: !name,
							onClick: () => {
								updateItem({
									name,
									description,
									color,
									emojiText: emoji,
								});
								close();
							},
						}
					: {
							type: "action",
							text: getMessage("friends.types.createUpdateModal.buttons.create"),
							disabled: !name,
							onClick: () => {
								createItem({
									id: crypto.randomUUID(),
									type: "custom",
									name,
									description,
									color,
									emojiText: emoji,
								});
								close();
							},
						},
			]}
		>
			<div className="create-edit-connection-type-modal">
				<div className="edit-name">
					<span>{getMessage("friends.types.createUpdateModal.name.title")}</span>
					<TextInput
						value={name}
						onType={setName}
						minLength={1}
						maxLength={MAX_CONNECTION_TYPE_NAME_LENGTH}
					/>
					<div className="text small text-right name-hint">
						{getMessage("friends.types.createUpdateModal.name.hint", {
							length: asLocaleString(name.length),
							maxLength: asLocaleString(MAX_CONNECTION_TYPE_NAME_LENGTH),
						})}
					</div>
				</div>
				<div className="edit-description">
					<span>{getMessage("friends.types.createUpdateModal.description.title")}</span>
					<TextInput
						value={description}
						onType={setDescription}
						minLength={1}
						maxLength={MAX_CONNECTION_TYPE_DESCRIPTION_LENGTH}
					/>
					<div className="text small text-right name-hint">
						{getMessage("friends.types.createUpdateModal.description.hint", {
							length: asLocaleString(description.length),
							maxLength: asLocaleString(MAX_CONNECTION_TYPE_DESCRIPTION_LENGTH),
						})}
					</div>
				</div>
				<div className="edit-emoji">
					<span>{getMessage("friends.types.createUpdateModal.emoji.title")}</span>
					{emojiHint && <div className="text small emoji-hint">{emojiHint}</div>}
					<TextInput
						value={emoji}
						typeCheck={checkEmoji}
						typeCheckCallback={emoji}
						onType={setEmoji}
					/>
				</div>
				<div className="edit-color">
					<span>{getMessage("friends.types.createUpdateModal.color.title")}</span>
					<div className="roseal-color-group">
						<input
							type="color"
							className="roseal-color-input circular-input"
							value={color}
							onBlur={(e) => {
								setColor(e.currentTarget.value);
							}}
						/>
					</div>
				</div>
			</div>
		</SimpleModal>
	);
}
