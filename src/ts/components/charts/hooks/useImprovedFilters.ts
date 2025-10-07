import {
	type ChartFiltersState,
	ageRestrictionsToCheck,
	ages,
	contentRestrictionToAge,
	defaultChartFiltersState,
} from "src/ts/constants/chartFilters";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString, unitListFormat } from "src/ts/helpers/i18n/intlFormats";
import { getUserSettings, getVerifiedAge } from "src/ts/helpers/requests/services/account";
import { compareArrays } from "src/ts/utils/objects";
import type { FilterData, FilterDropdown } from "../../core/filters/FiltersContainer";
import usePromise from "../../hooks/usePromise";
import { useMemo } from "preact/hooks";
import { ROBLOX_RELEASE_YEAR } from "src/ts/constants/misc";

function getNumberInputSuffix(min: number, max: number) {
	if (!min && !max) {
		return ".default";
	}

	if (!min) {
		return ".maxOnly";
	}

	if (!max) {
		return ".minOnly";
	}

	if (max === min) {
		return ".exact";
	}
	return "";
}

export default function useImprovedFilters(state: ChartFiltersState): FilterData[] {
	const [verifiedAge] = usePromise(getVerifiedAge);
	const [userSettings] = usePromise(getUserSettings);
	let contentRestrictionAge = userSettings?.contentAgeRestriction
		? contentRestrictionToAge[userSettings.contentAgeRestriction]
		: 0;

	if (
		verifiedAge?.verifiedAge &&
		contentRestrictionAge === 17 &&
		verifiedAge?.verifiedAge >= 18
	) {
		contentRestrictionAge = 18;
	}

	const [ageOptions, agePreviewTitleElements] = useMemo(() => {
		const ageOptions: FilterDropdown["options"] = [];
		const previewTitleElements: string[] = [];
		for (const age of ages) {
			if (!ageRestrictionsToCheck.includes(age) || age <= contentRestrictionAge) {
				ageOptions.push({
					label: getMessage(`charts.filters.filters.ages.values.${age}`),
					value: age,
				});

				if (state.age.includes(age)) {
					previewTitleElements.push(
						getMessage(`charts.filters.filters.ages.values.${age}`),
					);
				}
			}
		}

		return [ageOptions, previewTitleElements];
	}, [contentRestrictionAge, state.age]);
	const [createdYearItems, createdYearOptions, createdYearPreviewTitleElements] = useMemo(() => {
		const currentYear = new Date().getUTCFullYear();
		const createdYearOptions: FilterDropdown["options"] = [];
		const createdYearItems: number[] = [];
		const previewTitleElements: string[] = [];
		for (let i = currentYear; i >= ROBLOX_RELEASE_YEAR; i--) {
			const displayString = asLocaleString(i, {
				useGrouping: false,
			});
			createdYearItems.push(i);

			createdYearOptions.push({
				label: asLocaleString(displayString),
				value: i,
			});

			if (state.createdYear?.includes(i)) {
				previewTitleElements.push(asLocaleString(displayString));
			}
		}

		return [createdYearItems, createdYearOptions, previewTitleElements];
	}, [state.createdYear]);

	return [
		{
			id: "age",
			type: "checkbox",
			title: getMessage("charts.filters.filters.ages.label"),
			previewTitle: compareArrays(state.age, defaultChartFiltersState.age)
				? getMessage("charts.filters.filters.ages.values.All")
				: agePreviewTitleElements.length
					? unitListFormat.format(agePreviewTitleElements)
					: getMessage("charts.filters.filters.ages.values.None"),
			options: ageOptions,
			value: state.age,
			defaultValue: defaultChartFiltersState.age,
		},
		{
			id: "maxPlayerCount",
			type: "number",
			title: getMessage("charts.filters.filters.maxPlayerCount.label"),
			previewTitle: getMessage(
				`charts.filters.filters.maxPlayerCount.previewLabel${getNumberInputSuffix(state.maxPlayerCount[0], state.maxPlayerCount[1])}`,
				{
					min: asLocaleString(state.maxPlayerCount[0]),
					max: asLocaleString(state.maxPlayerCount[1]),
				},
			),
			defaultLabel: getMessage("charts.filters.filters.maxPlayerCount.defaultLabel"),
			min: 0,
			max: 700,
			value: state.maxPlayerCount,
			defaultValue: defaultChartFiltersState.maxPlayerCount,
		},
		{
			id: "playerCount",
			type: "number",
			title: getMessage("charts.filters.filters.playerCount.label"),
			previewTitle: getMessage(
				`charts.filters.filters.playerCount.previewLabel${getNumberInputSuffix(state.playerCount[0], state.playerCount[1])}`,
				{
					min: asLocaleString(state.playerCount[0]),
					max: asLocaleString(state.playerCount[1]),
				},
			),
			defaultLabel: getMessage("charts.filters.filters.playerCount.defaultLabel"),
			min: 0,
			max: 1_000_000_000,
			value: state.playerCount,
			defaultValue: defaultChartFiltersState.playerCount,
		},
		{
			id: "likeRatio",
			type: "number",
			title: getMessage("charts.filters.filters.likeRatio.label"),
			previewTitle: getMessage(
				`charts.filters.filters.likeRatio.previewLabel${getNumberInputSuffix(state.likeRatio[0], state.likeRatio[1])}`,
				{
					min: asLocaleString(state.likeRatio[0] / 100, {
						style: "percent",
					}),
					max: asLocaleString(state.likeRatio[1] / 100, {
						style: "percent",
					}),
				},
			),
			defaultLabel: getMessage("charts.filters.filters.likeRatio.defaultLabel"),
			min: 0,
			max: 100,
			value: state.likeRatio,
			defaultValue: defaultChartFiltersState.likeRatio,
		},
		{
			id: "visitCount",
			type: "number",
			title: getMessage("charts.filters.filters.visitCount.label"),
			previewTitle: getMessage(
				`charts.filters.filters.visitCount.previewLabel${getNumberInputSuffix(state.visitCount[0], state.visitCount[1])}`,
				{
					min: asLocaleString(state.visitCount[0]),
					max: asLocaleString(state.visitCount[1]),
				},
			),
			defaultLabel: getMessage("charts.filters.filters.visitCount.defaultLabel"),
			min: 0,
			max: 1_000_000_000_000,
			value: state.visitCount,
			defaultValue: defaultChartFiltersState.visitCount,
		},
		{
			id: "favoriteCount",
			type: "number",
			title: getMessage("charts.filters.filters.favoriteCount.label"),
			previewTitle: getMessage(
				`charts.filters.filters.favoriteCount.previewLabel${getNumberInputSuffix(state.favoriteCount[0], state.favoriteCount[1])}`,
				{
					min: asLocaleString(state.favoriteCount[0]),
					max: asLocaleString(state.favoriteCount[1]),
				},
			),
			defaultLabel: getMessage("charts.filters.filters.favoriteCount.defaultLabel"),
			min: 0,
			max: 1_000_000_000_000,
			value: state.favoriteCount,
			defaultValue: defaultChartFiltersState.favoriteCount,
		},
		{
			id: "playerAvatarType",
			type: "dropdown",
			title: getMessage("charts.filters.filters.playerAvatarType.label"),
			previewTitle: getMessage(
				`charts.filters.filters.playerAvatarType.values.${state.playerAvatarType}`,
			),
			options: [
				{
					label: getMessage("charts.filters.filters.playerAvatarType.values.All"),
					value: "All",
				},
				{
					label: getMessage(
						"charts.filters.filters.playerAvatarType.values.PlayerChoice",
					),
					value: "PlayerChoice",
				},
				{
					label: getMessage("charts.filters.filters.playerAvatarType.values.MorphToR15"),
					value: "MorphToR15",
				},
				{
					label: getMessage("charts.filters.filters.playerAvatarType.values.MorphToR6"),
					value: "MorphToR6",
				},
			],
			value: state.playerAvatarType,
			defaultValue: defaultChartFiltersState.playerAvatarType,
			firstItemDivider: true,
		},
		{
			id: "createdYear",
			type: "checkbox",
			title: getMessage("charts.filters.filters.createdYear.label"),
			previewTitle:
				!state.createdYear || compareArrays(state.createdYear, createdYearItems)
					? getMessage("charts.filters.filters.createdYear.values.All")
					: createdYearPreviewTitleElements.length
						? unitListFormat.format(createdYearPreviewTitleElements)
						: getMessage("charts.filters.filters.createdYear.values.None"),
			options: createdYearOptions,
			value: state.createdYear ?? createdYearItems,
			defaultValue: createdYearItems,
		},
	];
}
