import type { ComponentChildren } from "preact";
import IconButton from "./IconButton.tsx";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats.ts";

export type PaginationType = "basic" | "extended";

export const FIRST_PAGE = 1;
export type PaginationProps = {
	id?: string;
	type?: PaginationType;
	onChange: (current: number) => void;
	current: number;
	total?: number;
	hasNext?: boolean;
	disabled?: boolean;
	children?: ComponentChildren;
};

export default function Pagination({
	id,
	type = "basic",
	onChange,
	current,
	total = 0,
	hasNext = false,
	disabled,
}: PaginationProps) {
	const showExtended = type === "extended";
	const isFirstPage = current === FIRST_PAGE;
	const isLastPage = current === total || !hasNext;

	const goToFirstPage = () => onChange(FIRST_PAGE);
	const goToPrevPage = () => current > FIRST_PAGE && onChange(current - 1);
	const goToNextPage = () => (current < total || hasNext) && onChange(current + 1);
	const goToLastPage = () => onChange(total);
	const currentPageLabel =
		total > 1
			? `${asLocaleString(current)} / ${asLocaleString(total)}`
			: asLocaleString(current);

	return (
		<div className="pager-holder" id={id}>
			<ul className="pager">
				{showExtended && (
					<li className="first">
						<IconButton
							iconName="first-page"
							size="sm"
							onClick={goToFirstPage}
							disabled={disabled || isFirstPage}
						/>
					</li>
				)}
				<li className="pager-prev">
					<IconButton
						iconName="left"
						size="sm"
						onClick={goToPrevPage}
						disabled={disabled || isFirstPage}
					/>
				</li>
				<li className="pager-cur">
					<span id="rbx-current-page">{currentPageLabel}</span>
				</li>
				<li className="pager-next">
					<IconButton
						iconName="right"
						size="sm"
						onClick={goToNextPage}
						disabled={disabled || isLastPage}
					/>
				</li>
				{showExtended && (
					<li className="last">
						<IconButton
							iconName="last-page"
							size="sm"
							onClick={goToLastPage}
							disabled={disabled || isLastPage}
						/>
					</li>
				)}
			</ul>
		</div>
	);
}
