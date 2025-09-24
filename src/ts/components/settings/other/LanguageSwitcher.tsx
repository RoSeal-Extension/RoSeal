import { supportedLocales } from "#i18n";
import { useMemo, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { locales, setLocales } from "src/ts/helpers/i18n/locales.ts";
import { languageNamesFormat, unitListFormat } from "src/ts/helpers/i18n/intlFormats";
import Dropdown from "../../core/Dropdown";

export default function LanguageSwitcher() {
	const [hasChanged, setHasChanged] = useState(false);
	const [activeLanguage, setActiveLanguage] = useState(locales[0]);

	const [supportedLocalesList, unsupportedLocalesList] = useMemo(() => {
		const allLocales = new Set([...supportedLocales, ...locales]);
		const supportedLocalesList = [];
		const unsupportedLocalesList = [];

		for (const locale of allLocales) {
			const isSupported = supportedLocales.includes(locale);

			const value = {
				value: locale,
				label:
					navigator.language === locale
						? getMessage("settings.management.languageSwitcher.item.default", {
								language: languageNamesFormat.of(locale),
							})
						: languageNamesFormat.of(locale),
			};
			if (isSupported) {
				supportedLocalesList.push(value);
			} else {
				unsupportedLocalesList.push(value);
			}
		}

		return [supportedLocalesList, unsupportedLocalesList];
	}, [activeLanguage]);
	return (
		<>
			<Dropdown
				className="roseal-language-switcher"
				selectedItemValue={activeLanguage}
				onSelect={(value) => {
					setActiveLanguage(value);
					if (navigator.language === value) {
						setLocales?.();
					} else {
						setLocales?.([value]);
					}
					setHasChanged(true);
				}}
				selectionItems={[
					{
						id: "supported",
						label: getMessage("settings.management.languageSwitcher.list.supported"),
						items: supportedLocalesList,
					},
					{
						id: "unsupported",
						label: getMessage("settings.management.languageSwitcher.list.unsupported"),
						items: unsupportedLocalesList,
					},
				]}
			/>
			<p className="xsmall fallback-languages">
				{getMessage("settings.management.languageSwitcher.fallbackLanguages", {
					languages: unitListFormat.format(
						locales.slice(1).map((item) => languageNamesFormat.of(item) || item),
					),
				})}
			</p>
			{hasChanged && (
				<p className="small change-notice">
					{getMessage("settings.management.languageSwitcher.changeNotice")}
				</p>
			)}
		</>
	);
}
