import classNames from "classnames";

export type ShimmerCardProps = {
	className?: string;
};

export default function ShimmerCard({ className }: ShimmerCardProps) {
	return (
		<li className={classNames("catalog-item-container", className)}>
			<div className="item-card-container">
				<div className="item-card-link">
					<div className="item-card-thumb-container">
						<div className="shimmer item-card-thumb-progressive-loading" />
					</div>
				</div>
				<ul className="item-card-caption-progressive-loading shimmer-lines">
					<li className="placeholder shimmer-line" />
					<li className="placeholder shimmer-line" />
					<li className="placeholder shimmer-line" />
				</ul>
			</div>
		</li>
	);
}
