import classNames from "classnames";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { abbreviateNumber } from "src/ts/helpers/i18n/intlFormats.ts";
import { getGroupProfileLink } from "src/ts/utils/links.ts";
import Icon from "../core/Icon.tsx";
import Thumbnail from "../core/Thumbnail.tsx";

export type GroupCardProps = {
	className?: string;
	id: number;
	name: string;
	isOwned?: boolean;
	memberCount?: number;
	setActiveGroup?: (groupId: number, name: string) => void;
	isLocked?: boolean;
	leaveGroup?: () => void;
};

export default function GroupCard({
	className,
	id,
	name,
	isLocked,
	isOwned,
	memberCount,
	leaveGroup,
	setActiveGroup,
}: GroupCardProps) {
	return (
		<a
			className={classNames("groups-list-item", className)}
			onClick={(event) => {
				if (setActiveGroup) {
					event.preventDefault();
					event.stopImmediatePropagation();

					setActiveGroup(id, name);
				}
			}}
			href={getGroupProfileLink(id, name)}
			title={name}
		>
			<div className="groups-list-item-thumbnail">
				<Thumbnail
					request={{
						targetId: id,
						type: "GroupIcon",
						size: "150x150",
					}}
					containerClassName="size-full"
					bypassLoading={true}
				/>
			</div>
			<div className="group-list-item-info grow-1 min-width-0">
				<div className="flex items-baseline">
					<div className="text-no-wrap text-truncate-end">
						{isLocked && (
							<span className="group-list-item-locked-badge">
								<Icon name="lock" />
							</span>
						)}
						<span className="text-title-medium">{name}</span>
					</div>
				</div>
				{memberCount !== undefined && (
					<div className="text-no-wrap text-body-medium text-truncate-end content-muted">
						<span className="text-body-medium">
							{getMessage("group.card.stats", {
								membersCount: abbreviateNumber(memberCount),
								isOwned: isOwned,
							})}
						</span>
					</div>
				)}
			</div>
			{leaveGroup && (
				<button type="button" className="roseal-btn leave-group-btn">
					<Icon
						name="close"
						size="16x16"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							leaveGroup();
						}}
					/>
				</button>
			)}
		</a>
	);
}
