import classNames from "classnames";
import { I18N_FEATURE_PREFIX } from "src/ts/helpers/features/constants";
import type { AnyFeature, Feature } from "src/ts/helpers/features/featuresData";
import { getMessage, hasMessage } from "src/ts/helpers/i18n/getMessage";
import Dropdown from "../../core/Dropdown";
import TextInput from "../../core/TextInput";
import Toggle from "../../core/Toggle";
import useFeatureValue from "../../hooks/useFeatureValue";
import {
	asLocaleString,
	currencyNamesFormat,
	regionNamesFormat,
} from "src/ts/helpers/i18n/intlFormats";

export type FeatureComponentProps = {
	feature: Feature;
	updateFeatureValue: (newValue: unknown) => void;
	featureValue: unknown;
};

export function FeatureComponent({
	feature: { component, id },
	featureValue,
	updateFeatureValue,
}: FeatureComponentProps) {
	const [featureValueEnabled] = useFeatureValue(id as AnyFeature["id"], undefined);
	const className = classNames("feature-component", {
		"with-toggle":
			component.type === "DropdownWithToggle" || component.type === "InputWithToggle",
		"roseal-disabled": featureValueEnabled === undefined,
	});

	return (
		<>
			{component.type === "Toggle" && (
				<Toggle
					className={className}
					isOn={featureValue as boolean}
					onToggle={(isOn) => {
						if (component.shouldChangeValue?.(isOn) === false) {
							return;
						}
						updateFeatureValue(isOn);
					}}
				/>
			)}
			{component.type === "Dropdown" && (
				<Dropdown
					className={className}
					selectionItems={component.values.map((value) => {
						const labelKey = `${I18N_FEATURE_PREFIX}${id}.${"values" in value ? `categories.${value.id}` : `values.${value.value}`}`;

						if ("values" in value) {
							return {
								...value,
								items: value.values.map((value) => {
									const labelKey = `${I18N_FEATURE_PREFIX}${id}.values.${value.value}`;

									return {
										...value,
										label: hasMessage(labelKey)
											? getMessage(labelKey)
											: value.labelFormat === "currencyCode"
												? currencyNamesFormat.of(value.value as string)
												: value.labelFormat === "region"
													? regionNamesFormat.of(value.value as string)
													: asLocaleString(value.value),
									};
								}),
								label: hasMessage(labelKey) ? getMessage(labelKey) : value.id,
							};
						}

						return {
							...value,
							label: hasMessage(labelKey)
								? getMessage(labelKey)
								: value.labelFormat === "currencyCode"
									? currencyNamesFormat.of(value.value as string)
									: value.labelFormat === "region"
										? regionNamesFormat.of(value.value as string)
										: asLocaleString(value.value),
						};
					})}
					selectedItemValue={featureValue as string}
					onSelect={(value) => {
						if (component.shouldChangeValue?.(value) === false) {
							return;
						}

						updateFeatureValue(value);
					}}
				/>
			)}
			{component.type === "InputWithToggle" && (
				<div className={className}>
					<TextInput
						onChange={(value) =>
							updateFeatureValue([(featureValue as [boolean, string])?.[0], value])
						}
						disabled={!(featureValue as [boolean, string])?.[0]}
						value={(featureValue as [boolean, string])?.[1]}
					/>
					<Toggle
						isOn={(featureValue as [boolean, string])?.[0]}
						onToggle={(value) =>
							updateFeatureValue([value, (featureValue as [boolean, string])?.[1]])
						}
					/>
				</div>
			)}
			{component.type === "DropdownWithToggle" && (
				<div className={className}>
					<Dropdown
						disabled={!(featureValue as [boolean, string])?.[0]}
						className="feature-component"
						selectionItems={component.values.map((value) => {
							const labelKey = `${I18N_FEATURE_PREFIX}${id}.${"values" in value ? `categories.${value.id}` : `values.${value.value}`}`;

							if ("values" in value) {
								return {
									...value,
									items: value.values.map((value) => {
										const labelKey = `${I18N_FEATURE_PREFIX}${id}.values.${value.value}`;

										return {
											...value,
											label: hasMessage(labelKey)
												? getMessage(labelKey)
												: value.labelFormat === "currencyCode"
													? currencyNamesFormat.of(value.value as string)
													: value.labelFormat === "region"
														? regionNamesFormat.of(
																value.value as string,
															)
														: asLocaleString(value.value),
										};
									}),
									label: hasMessage(labelKey) ? getMessage(labelKey) : value.id,
								};
							}

							return {
								...value,
								label: hasMessage(labelKey)
									? getMessage(labelKey)
									: value.labelFormat === "currencyCode"
										? currencyNamesFormat.of(value.value as string)
										: value.labelFormat === "region"
											? regionNamesFormat.of(value.value as string)
											: asLocaleString(value.value),
							};
						})}
						selectedItemValue={
							(featureValue as [boolean, string])?.[1] || component.defaultValue
						}
						onSelect={(value) =>
							updateFeatureValue([(featureValue as [boolean, string])?.[0], value])
						}
					/>
					<Toggle
						isOn={(featureValue as [boolean, string])?.[0]}
						onToggle={(value) =>
							updateFeatureValue([value, (featureValue as [boolean, string])?.[1]])
						}
					/>
				</div>
			)}
		</>
	);
}
