import { useMemo, useState } from "preact/hooks";
import MdOutlineFillFolder from "@material-symbols/svg-400/outlined/folder-fill.svg";
import MdOutlineFillFolderOpen from "@material-symbols/svg-400/outlined/folder_open-fill.svg";
import Icon from "../core/Icon.tsx";
import {
	type ExpandedFolderItem,
	type ExpandedGroupItem,
	DEFAULT_FOLDER_COLOR,
} from "src/ts/constants/groupOrganization.ts";
import type { ComponentChildren } from "preact";
import IconButton from "../core/IconButton.tsx";
import { getFolderName } from "./utils/groupOrganization.ts";
import { FolderCustomizationModal } from "./modals/FolderCustomizationModal.tsx";

export type ParentProps = { showActive: boolean; children: ComponentChildren };

export type DNDGroupFolderProps = {
	name?: string;
	color?: string;
	groups: ExpandedGroupItem[];

	updateFolder: (
		partial: Omit<ExpandedFolderItem, "dndId" | "groups" | "id" | "type" | "parent">,
	) => void;
	isOpen?: boolean;
	toggleOpen?: () => void;
	dndId: string;
};

export default function DNDGroupFolder({
	name,
	color = DEFAULT_FOLDER_COLOR,
	groups,
	updateFolder,
	isOpen,
	toggleOpen,
	dndId,
}: DNDGroupFolderProps) {
	const folderName = useMemo(() => getFolderName(name, dndId, groups), [groups, name]);
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<>
			<FolderCustomizationModal
				show={isModalOpen}
				hide={() => setIsModalOpen(false)}
				name={name}
				color={color}
				updateFolder={(data) => {
					updateFolder(data);
					setIsModalOpen(false);
				}}
			/>
			<button
				type="button"
				className="groups-list-item folder-item-container"
				title={folderName}
				onClick={toggleOpen}
			>
				<div className="groups-list-item-thumbnail folder-icon-container">
					<span className="thumbnail-2d-container">
						{isOpen ? (
							<MdOutlineFillFolderOpen
								className="folder-icon roseal-icon"
								style={{
									color,
								}}
							/>
						) : (
							<MdOutlineFillFolder
								className="folder-icon roseal-icon"
								style={{
									color,
								}}
							/>
						)}
					</span>
				</div>
				<div className="group-list-item-info grow-1 min-width-0">
					<div className="flex items-baseline">
						<div className="text-no-wrap text-truncate-end">
							<span className="text-title-medium">{folderName}</span>
						</div>
					</div>
				</div>
				{isOpen !== undefined && (
					<div className="folder-groups-btns">
						<IconButton
							iconType="generic"
							size="xs"
							iconName="edit"
							onClick={(e) => {
								e.stopPropagation();

								setIsModalOpen(true);
							}}
						/>
						<Icon name={isOpen ? "up" : "down"} size="16x16" />
					</div>
				)}
			</button>
		</>
	);
}
