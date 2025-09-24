import { useMemo } from "preact/hooks";
import { DEFAULT_NONE_CONNECTION_TYPE, type ConnectionType } from "src/ts/constants/friends";
import Popover from "../core/Popover";
import {
	getConnectionTypeDisplayDescription,
	getConnectionTypeDisplayName,
	getConnectionTypeIcon,
} from "./utils/types";
import type { RefObject } from "preact";
import classNames from "classnames";
import Button from "../core/Button";
import IconButton from "../core/IconButton";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { DndProvider, getBackendOptions, MultiBackend, Tree } from "@minoru/react-dnd-treeview";

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
							const displayName = useMemo(() => {
								return getConnectionTypeDisplayName(type);
							}, [type]);
							const displayDescription = useMemo(() => {
								return getConnectionTypeDisplayDescription(type);
							}, [type]);

							const icon = useMemo(() => getConnectionTypeIcon(type, true), [type]);

							return (
								<li
									key={type.id}
									className={classNames("type-selection", {
										"has-color": type.color,
										"is-dragging": render.isDragging,
										active: type.id === connectionType.id,
									})}
									style={{
										"--type-color": type.color,
									}}
								>
									<button
										type="button"
										className="type-selection-btn roseal-btn"
										onClick={() => {
											setConnectionType(type.id);
											document.body?.click();
										}}
									>
										{icon && (
											<div className="type-icon-container" key={type.id}>
												{icon}
											</div>
										)}
										<div
											className={classNames(
												"type-name-description-container text-overflow",
												{
													"has-description": displayDescription,
												},
											)}
										>
											<div className="type-name-container">
												<div className="type-name text-overflow">
													{displayName}
												</div>
												{type.type === "custom" && (
													<IconButton
														iconName="edit"
														size="xs"
														className="edit-type-btn"
														onClick={() => openEditType(type.id)}
													/>
												)}
											</div>
											{displayDescription && (
												<div className="type-description-container">
													{displayDescription}
												</div>
											)}
										</div>
									</button>
								</li>
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
