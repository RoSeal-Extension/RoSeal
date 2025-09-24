import classNames from "classnames";
import { useState } from "preact/hooks";
import MarketplaceCard, { type MarketplaceCardProps } from "./Card";
import ShimmerCard from "./ShimmerCard";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Tooltip from "../core/Tooltip";
import MdOutlineInfoIcon from "@material-symbols/svg-400/outlined/info.svg";

export type ItemsListContainerProps = {
	className?: string;
	listClassName?: string;
	title: string;
	description?: string;
	infoText?: string;
	items?: (MarketplaceCardProps | null)[];
};

export default function ItemsListContainer({
	className,
	listClassName,
	title,
	description,
	infoText,
	items,
}: ItemsListContainerProps) {
	const [collapsed, setCollapsed] = useState(true);

	return (
		<div className={classNames("roseal-items-container", className)}>
			<div className="container-header">
				<div className="container-title-container">
					<div className="container-title">
						<h2>{title}</h2>
						{description && <p>{description}</p>}
					</div>
					{infoText && (
						<Tooltip
							includeContainerClassName={false}
							containerClassName="container-tooltip-container"
							button={<MdOutlineInfoIcon className="roseal-icon" />}
						>
							{infoText}
						</Tooltip>
					)}
				</div>
				<button
					type="button"
					className="btn-fixed-width btn-secondary-xs btn-more see-all-link-icon"
					onClick={() => setCollapsed(!collapsed)}
				>
					{getMessage(`marketplace.landing.${collapsed ? "seeAll" : "seeLess"}`)}
				</button>
			</div>
			<ul
				className={classNames("items-list-container", listClassName, {
					collapsed,
				})}
			>
				{!items && new Array(50).fill(<ShimmerCard />)}
				{items?.map((item) => item && <MarketplaceCard key={item.id} {...item} />)}
			</ul>
		</div>
	);
}
