import { useEffect, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import SimpleModal from "../../core/modal/SimpleModal";
import TextInput from "../../core/TextInput";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { FOLDER_NAME_MAX_LENGTH } from "src/ts/constants/groupOrganization";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";

export type UpdateFolderProps = {
	name?: string;
	color?: string;
};

export type FolderCustomizationModalProps = {
	show?: boolean;
	name?: string;
	color?: string;
	updateFolder: (props: UpdateFolderProps) => void;
	hide: () => void;
};

export function FolderCustomizationModal({
	name,
	color,
	show,
	updateFolder,
	hide,
}: FolderCustomizationModalProps) {
	const [newName, setNewName] = useState<string | undefined>("");
	const [newColor, setNewColor] = useState<string | undefined>("");

	useEffect(() => {
		setNewName(name);
	}, [name]);

	useEffect(() => {
		setNewColor(color);
	}, [color]);

	return (
		<SimpleModal
			size="sm"
			centerTitle
			title={getMessage("group.list.customizeFolderModal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			centerBody="flex"
			closeable={false}
			show={show}
			buttons={[
				{
					type: "neutral",
					text: getMessage("group.list.customizeFolderModal.neutral"),
					onClick: () => {
						setNewName(name);
						setNewColor(color);
						hide();
					},
				},
				{
					type: "action",
					text: getMessage("group.list.customizeFolderModal.action"),
					onClick: () => {
						updateFolder({
							name: newName,
							color: newColor,
						});
					},
				},
			]}
		>
			<div className="folder-customization-modal">
				<div className="edit-name">
					<span>{getMessage("group.list.customizeFolderModal.name")}</span>
					<TextInput
						onType={setNewName}
						maxlength={FOLDER_NAME_MAX_LENGTH}
						value={newName}
					/>
					<div className="text small text-right name-hint">
						{getMessage("group.list.customizeFolderModal.nameLengthHint", {
							length: asLocaleString(newName?.length ?? 0),
							maxLength: asLocaleString(FOLDER_NAME_MAX_LENGTH),
						})}
					</div>
				</div>
				<div className="edit-color">
					<span>{getMessage("group.list.customizeFolderModal.color")}</span>
					<div className="roseal-color-group">
						<input
							className="roseal-color-input circular-input"
							type="color"
							value={newColor}
							onBlur={(e) => {
								setNewColor(e.currentTarget.value);
							}}
						/>
					</div>
				</div>
			</div>
		</SimpleModal>
	);
}
