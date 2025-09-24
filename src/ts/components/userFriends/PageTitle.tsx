import MdOutlineArrowDownward from "@material-symbols/svg-400/outlined/arrow_downward-fill.svg";
import MdOutlineArrowUpward from "@material-symbols/svg-400/outlined/arrow_upward-fill.svg";
import MdOutlineRefresh from "@material-symbols/svg-400/outlined/refresh-fill.svg";
import classNames from "classnames";
import type { ComponentChildren } from "preact";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import type { SortOrder } from "src/ts/helpers/requests/services/badges";
import Icon from "../core/Icon";
import Tooltip from "../core/Tooltip";

export type FriendsPageTitleProps = {
	title: string;
	tooltipContent: string;
	className?: string;
	children?: ComponentChildren;
	sortOrder?: SortOrder;
	disabled?: boolean;
	setSortOrder?: (sortOrder: SortOrder) => void;
	onRefresh?: () => void;
};

export default function FriendsPageTitle({
	title,
	tooltipContent,
	className,
	children,
	sortOrder,
	disabled,
	setSortOrder,
	onRefresh,
}: FriendsPageTitleProps) {
	return (
		<div className={classNames("container-header", className)}>
			<div className="friends-left">
				<h2 className="friends-subtitle">{title}</h2>
				<Tooltip button={<Icon name="moreinfo" />}>{tooltipContent}</Tooltip>
			</div>
			<div className="friends-right">
				{onRefresh && (
					<Tooltip
						includeContainerClassName={false}
						button={
							<button
								type="button"
								className={classNames("btn-generic-more-sm refresh-page-btn", {
									disabled,
								})}
								onClick={onRefresh}
							>
								<MdOutlineRefresh className="roseal-icon" />
							</button>
						}
					>
						{getMessage("friends.buttons.refresh.tooltip")}
					</Tooltip>
				)}
				{setSortOrder && sortOrder !== undefined && (
					<Tooltip
						includeContainerClassName={false}
						button={
							<button
								type="button"
								className={classNames("btn-generic-more-sm sort-order-btn", {
									disabled,
								})}
								onClick={() => {
									setSortOrder(sortOrder === "Desc" ? "Asc" : "Desc");
								}}
							>
								{sortOrder === "Desc" ? (
									<MdOutlineArrowDownward className="roseal-icon" />
								) : (
									<MdOutlineArrowUpward className="roseal-icon" />
								)}
							</button>
						}
					>
						{getMessage(
							`friends.buttons.direction.tooltip.${sortOrder?.toLowerCase() as "asc" | "desc"}`,
						)}
					</Tooltip>
				)}
				{children}
			</div>
		</div>
	);
}
