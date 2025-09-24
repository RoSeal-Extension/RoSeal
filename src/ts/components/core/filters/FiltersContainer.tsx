import Filter from "./Filter";

export type FilterNumberInput = {
	type: "number";
	min: number;
	max: number;
	value: [number, number];
	defaultValue: [number, number];
};

export type FilterCheckbox<T extends string | number | boolean = string | number | boolean> = {
	type: "checkbox";
	options: {
		label: string;
		value: T;
	}[];
	value: T[];
	defaultValue: T[];
};

export type FilterDropdown<T extends string | number | boolean = string | number | boolean> = {
	type: "dropdown";
	value: T;
	options: {
		label: string;
		value: T;
	}[];
	defaultValue: T;
};

export type ColorFilterWithCheckbox = {
	enabled: boolean;
	color: [number, number, number];
};
export type FilterColorsWithCheckboxesFilter = {
	type: "colorsWithCheckboxes";
	options: {
		label: string;
	}[];
	value: ColorFilterWithCheckbox[];
	defaultValue: ColorFilterWithCheckbox[];
};

export type FilterData = {
	id: string;
	title: string;
	titleTooltip?: string;
	previewTitle: string;
	firstItemDivider?: boolean;
} & (FilterDropdown | FilterNumberInput | FilterCheckbox | FilterColorsWithCheckboxesFilter);

export type ApplyFilterValueFn<T extends FilterData> = (
	filterId: T["id"],
	newValue: T["value"],
) => void;

export type FiltersContainerProps<T extends FilterData> = {
	title: string;
	filters: T[];
	applyFilterValue: ApplyFilterValueFn<T>;
};

export default function FiltersContainer<T extends FilterData>({
	title,
	filters,
	applyFilterValue,
}: FiltersContainerProps<T>) {
	return (
		<div className="roseal-filters-container">
			<div className="filters-header-container">
				<span className="filters-header">{title}</span>
			</div>
			<div className="filter-items-container">
				{filters.map((filter) => (
					<Filter key={filter.id} filter={filter} applyFilterValue={applyFilterValue} />
				))}
			</div>
		</div>
	);
}
