import type { ConnectionType } from "src/ts/constants/friends";
import {
	getConnectionTypeDisplayDescription,
	getConnectionTypeDisplayName,
	getConnectionTypeIcon,
} from "./utils/types";
import { useMemo } from "preact/hooks";
import classNames from "classnames";
import IconButton from "../core/IconButton";

export type FriendCardTypesItemProps = {
	type: ConnectionType;
	active?: boolean;
	isDragging?: boolean;
	setConnectionType: (typeId: string | number) => void;
	openEditType: (typeId: string | number) => void;
};

export function FriendCardTypesItem({
	type,
	active,
	isDragging,
	setConnectionType,
	openEditType,
}: FriendCardTypesItemProps) {
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
				"is-dragging": isDragging,
				active,
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
					className={classNames("type-name-description-container text-overflow", {
						"has-description": displayDescription,
					})}
				>
					<div className="type-name-container">
						<div className="type-name text-overflow">{displayName}</div>
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
						<div className="type-description-container">{displayDescription}</div>
					)}
				</div>
			</button>
		</li>
	);
}
