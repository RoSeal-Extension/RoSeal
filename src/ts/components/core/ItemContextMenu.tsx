import { useRef } from "preact/hooks";
import Popover from "./Popover.tsx";
import classNames from "classnames";
import { isValidElement, toChildArray, type ComponentChildren } from "preact";
import IconButton from "./IconButton.tsx";

export type ItemContextMenuProps = {
	id?: string;
	className?: string;
	containerClassName?: string;
	buttonClassName?: string;
	wrapChildren?: boolean;
	children?: ComponentChildren;
	includeContextMenuClassName?: boolean;
	setContainer?: boolean;
	dropdownClassName?: string;
};

export default function ItemContextMenu({
	id,
	containerClassName,
	dropdownClassName,
	className,
	buttonClassName,
	children,
	wrapChildren = true,
	includeContextMenuClassName,
	setContainer = true,
}: ItemContextMenuProps) {
	const ref = useRef<HTMLDivElement>(null);

	return (
		<div id={id} className={containerClassName} ref={setContainer ? ref : undefined}>
			<Popover
				className={className}
				trigger="click"
				placement="bottom"
				containerPadding={20}
				closeOnClick
				button={
					<IconButton
						iconType="generic"
						iconName="more"
						size="sm"
						className={classNames("rbx-menu-item", buttonClassName, {
							"item-context-menu": includeContextMenuClassName,
						})}
					/>
				}
				container={setContainer ? ref.current : undefined}
			>
				<div className="popover-content">
					<div className={classNames("dropdown-menu", dropdownClassName)}>
						{wrapChildren
							? toChildArray(children).map((child, i) => (
									<li
										key={
											isValidElement(child) && "key" in child.props
												? child.props.key
												: i
										}
									>
										{child}
									</li>
								))
							: children}
					</div>
				</div>
			</Popover>
		</div>
	);
}
