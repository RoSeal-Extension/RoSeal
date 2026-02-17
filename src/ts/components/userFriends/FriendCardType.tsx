import { useMemo } from "preact/hooks";
import { DEFAULT_NONE_CONNECTION_TYPE, type ConnectionType } from "src/ts/constants/friends";
import Popover from "../core/Popover";
import { getConnectionTypeDisplayName, getConnectionTypeIcon } from "./utils/types";
import type { RefObject } from "preact";
import Button from "../core/Button";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { DndProvider, getBackendOptions, MultiBackend, Tree } from "@minoru/react-dnd-treeview";
import { FriendCardTypesItem } from "./FriendCardTypeItem";

export type FriendCardTypesProps = {
	availableConnectionTypes: ConnectionType[];
	connectionType: ConnectionType;
	container: RefObject<HTMLDivElement>;
	userId: number;
	updateConnectionTypesLayout: (types: ConnectionType[]) => void;
	openEditType: (id: string | number) => void;
	openCreateType: (userId: number) => void;
	setConnectionType: (id: string | number) => void;
};

export default function FriendCardTypes({
	availableConnectionTypes,
	connectionType,
	container,
	userId,
	updateConnectionTypesLayout,
	openEditType,
	openCreateType,
	setConnectionType,
}: FriendCardTypesProps) {
	const displayName = useMemo(() => {
		if (connectionType.id === DEFAULT_NONE_CONNECTION_TYPE.id) return;

		return getConnectionTypeDisplayName(connectionType);
	}, [connectionType]);
	const icon = useMemo(() => getConnectionTypeIcon(connectionType, true), [connectionType]);
	const tree = useMemo(
		() =>
			availableConnectionTypes.map((item) => ({
				parent: 0,
				id: item.id,
				text: "",
				data: item,
			})),
		[availableConnectionTypes],
	);

	return (
		<Popover
			trigger="click"
			placement="auto"
			button={
				<button type="button" className="card-connection-type roseal-btn">
					{icon && (
						<div className="connection-type-icon-container" key={connectionType.id}>
							{icon}
						</div>
					)}
					{displayName && (
						<div className="connection-type-name-container">{displayName}</div>
					)}
				</button>
			}
			container={container}
		>
			<div className="friend-card-type-popover">
				<DndProvider backend={MultiBackend} options={getBackendOptions()}>
					<Tree
						classes={{
							placeholder: "drop-placeholder",
							root: "types-selection rbx-scrollbar roseal-scrollbar",
						}}
						sort={false}
						rootId={0}
						tree={tree}
						canDrag={(item) => item?.data?.id !== DEFAULT_NONE_CONNECTION_TYPE.id}
						render={(node, render) => {
							const type = node.data!;

							return (
								<FriendCardTypesItem
									type={type}
									active={connectionType.id === type.id}
									isDragging={render.isDragging}
									setConnectionType={setConnectionType}
									openEditType={openEditType}
								/>
							);
						}}
						onDrop={(data) => {
							updateConnectionTypesLayout(data.map((item) => item.data!));
						}}
						canDrop={(items, options) => {
							let hasPassed = false;
							for (const item of items) {
								if (hasPassed) {
									return false;
								}
								if (item.data?.id === DEFAULT_NONE_CONNECTION_TYPE.id) {
									hasPassed = true;
								}
							}

							return !options.dropTargetId;
						}}
						placeholderRender={() => <div className="drop-placeholder-item" />}
					/>
				</DndProvider>
				<Button
					type="control"
					className="create-type-btn"
					onClick={() => {
						openCreateType(userId);
						document.body?.click();
					}}
				>
					{getMessage("friends.types.createTypeButton")}
				</Button>
			</div>
		</Popover>
	);
}
