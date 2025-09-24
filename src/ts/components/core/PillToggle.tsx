import classNames from "classnames";

export type PillToggleProps<T extends string | number = string | number> = {
	className?: string;
	items: {
		id: T;
		label: string;
	}[];
	onClick: (id: T) => void;
	currentId?: T;
};

export default function PillToggle<T extends string | number>({
	className,
	items,
	onClick,
	currentId,
}: PillToggleProps<T>) {
	return (
		<div className={classNames("roseal-pill-toggle", className)}>
			{items.map((item) => (
				<div key={item.id} className="pill-item">
					<input
						className="pill-input"
						type="radio"
						value={item.id}
						checked={item.id === currentId}
					/>
					<label
						className={classNames("pill-label", {
							"checked-label": item.id === currentId,
						})}
						for={item.id.toString()}
						onClick={() => onClick(item.id)}
					>
						{item.label}
					</label>
				</div>
			))}
		</div>
	);
}
