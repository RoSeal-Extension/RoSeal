import { useCallback, useEffect, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString, languageNamesFormat } from "src/ts/helpers/i18n/intlFormats";
import {
	listExperienceSearchSuggestions,
	listRobloxSupportedLocales,
} from "src/ts/helpers/requests/services/misc";
import Dropdown from "../core/Dropdown";
import Loading from "../core/Loading";
import usePromise from "../hooks/usePromise";

export default function TrendingSearchesPage() {
	const [selectedLanguageCode, _setSelectedLanguageCode] = useState<string | undefined>(() => {
		const params = new URLSearchParams(window.location.search);
		const languageCode = params.get("languageCode");

		if (languageCode) return languageCode;
	});
	const setSelectedLanguageCode = useCallback(
		(value: string) => {
			_setSelectedLanguageCode(value);

			const newUrl = new URL(window.location.href);
			newUrl.searchParams.set("languageCode", value);

			window.history.pushState(null, "", newUrl.toString());
		},
		[_setSelectedLanguageCode],
	);
	const [localeOptions] = usePromise(
		() =>
			listRobloxSupportedLocales().then(({ supportedLocales }) =>
				supportedLocales
					.map((locale) => ({
						id: locale.id,
						value: locale.language.languageCode,
						label: languageNamesFormat.of(locale.language.languageCode),
					}))
					.sort((a, b) => a.id - b.id),
			),
		[],
	);

	const [trendingSearches] = usePromise(async () => {
		if (!selectedLanguageCode) return;

		const suggestions: string[] = [];

		let cursor = 0;

		while (true) {
			const data = await listExperienceSearchSuggestions({
				type: 0,
				cursor,
				language: selectedLanguageCode,
			});

			for (const item of data.entries) {
				suggestions.push(item.searchQuery);
			}

			if (!data.hasNextPage) break;
			cursor++;
		}

		return suggestions;
	}, [selectedLanguageCode]);

	useEffect(() => {
		if (!localeOptions || selectedLanguageCode) {
			return;
		}

		setSelectedLanguageCode(localeOptions[0].value);
	}, [localeOptions]);

	return (
		<div className="trending-searches-container section">
			<div className="container-header">
				<h1>{getMessage("trendingSearches.title")}</h1>
			</div>
			<div className="section-content remove-panel">
				<p>{getMessage("trendingSearches.description")}</p>
				{localeOptions && (
					<Dropdown
						className="language-selector"
						selectionItems={localeOptions}
						selectedItemValue={selectedLanguageCode}
						onSelect={setSelectedLanguageCode}
					/>
				)}
				{!trendingSearches && <Loading />}
				{trendingSearches && (
					<div className="trending-table">
						<table className="table table-striped">
							<thead>
								<tr>
									<th className="text-label">
										{getMessage("trendingSearches.columns.ranking")}
									</th>
									<th className="text-label">
										{getMessage("trendingSearches.columns.query")}
									</th>
								</tr>
							</thead>
							<tbody>
								{trendingSearches.map((search, index) => (
									<tr key={search}>
										<td>
											{getMessage("trendingSearches.item.ranking", {
												number: asLocaleString(index + 1),
											})}
										</td>
										<td>{search}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
