import type { Signal } from "@preact/signals";
import classNames from "classnames";
import { useState } from "preact/hooks";
import { I18N_FEATURE_PREFIX } from "src/ts/helpers/features/constants";
import type { AnyFeature, Feature } from "src/ts/helpers/features/featuresData";
import { isFeatureDisabled } from "src/ts/helpers/features/helpers";
import { flagCallMatch } from "src/ts/helpers/flags/flags";
import { getMessage, hasMessage } from "src/ts/helpers/i18n/getMessage";
import { unitListFormat } from "src/ts/helpers/i18n/intlFormats";
import { hasPermissions } from "src/ts/helpers/permissions";
import {
	LOCALSTORAGE_PREFIX,
	removeExtensionSessionStorage,
	storage,
} from "src/ts/helpers/storage";
import { error } from "src/ts/utils/console";
import Alert from "../../core/Alert";
import Button from "../../core/Button";
import Divider from "../../core/Divider";
import Icon from "../../core/Icon";
import ItemContextMenu from "../../core/ItemContextMenu";
import { success } from "../../core/systemFeedback/helpers/globalSystemFeedback";
import useFeatureValue from "../../hooks/useFeatureValue";
import useFlag from "../../hooks/useFlag";
import { shouldFeatureDisplay } from "./shouldFeatureDisplay";
import { FeatureComponent } from "./FeatureComponent";
import { FeatureTypeLabel } from "./FeatureTypeLabel";
import { FeaturePermissionsContainer } from "./FeaturePermissionsContainer";
import FeaturePermissions from "../../popup/Permissions";

export type FeatureContainerProps = {
	feature: Feature;
	asSection?: boolean;
	keyword: Signal<string>;
};

export default function FeatureContainer({
	feature,
	asSection = true,
	keyword,
}: FeatureContainerProps) {
	const featureDeprecatedFlag = useFlag(
		typeof feature.deprecated === "object" ? feature.deprecated.value.namespace : undefined,
		typeof feature.deprecated === "object" ? feature.deprecated.value.key : undefined,
	);

	const featureDeprecated =
		typeof feature.deprecated === "object"
			? flagCallMatch(feature.deprecated.value, featureDeprecatedFlag)
			: feature.deprecated;
	const featureDisabled = isFeatureDisabled(feature);
	const featureDirectlyDisabled = isFeatureDisabled(feature, false);
	const [featureValue, _updateFeatureValue] = useFeatureValue(
		feature.id as AnyFeature["id"],
		undefined,
		undefined,
		true,
	);
	const [showError, setShowError] = useState(false);
	const [descriptionValues, setDescriptionValues] = useState(() => {
		const descriptionValues: Record<string, unknown> | undefined =
			feature.descriptionVariables && {};

		if (feature.descriptionVariables) {
			for (const key in feature.descriptionVariables) {
				const value = feature.descriptionVariables[key];
				if (typeof value?.value === "string") {
					descriptionValues![key] = value.placeholder;
				} else if (value?.value instanceof Promise) {
					value.value.then((data) =>
						setDescriptionValues((value) => ({
							...value,
							[key]: data,
						})),
					);
				}
			}
		}

		return descriptionValues;
	});

	const updateFeatureValue = (value: unknown) => {
		if (feature.permissions?.required) {
			return hasPermissions(feature.permissions.required).then((hasPermissions) => {
				if (hasPermissions) {
					_updateFeatureValue(value as typeof featureValue);
					setShowError(false);
				} else {
					setShowError(true);
				}
			});
		}
		_updateFeatureValue(value as typeof featureValue);
	};

	const featureDeprecationNoteKey = `${I18N_FEATURE_PREFIX}${feature.id}.deprecationNote`;
	const featureNameKey = `${I18N_FEATURE_PREFIX}${feature.id}.name`;
	const featureDescriptionKey = `${I18N_FEATURE_PREFIX}${feature.id}.description`;
	const featureComponent = !featureDisabled && (
		<FeatureComponent
			feature={feature}
			featureValue={featureValue}
			updateFeatureValue={updateFeatureValue}
		/>
	);
	const featureDisabledTextKey = `${I18N_FEATURE_PREFIX}${feature.id}.disabledNote`;

	const displayedSubfeatures = feature.subfeatures?.items.filter((subfeature) =>
		shouldFeatureDisplay(subfeature, keyword.value),
	);

	return (
		<div
			className={classNames("feature-container", {
				"is-subfeature": feature._isSubOf,
				"roseal-disabled": featureDisabled,
				"section-content notifications-section": asSection,
			})}
		>
			{featureDeprecated && (
				<Alert type="warning" className="feature-deprecated-alert" show>
					{(hasMessage(featureDeprecationNoteKey) &&
						getMessage(featureDeprecationNoteKey)) ||
						getMessage("settings.features.defaultDeprecationNote", {
							bold: (contents: string) => <b>{contents}</b>,
						})}
				</Alert>
			)}
			{featureDirectlyDisabled && (
				<>
					<div className="feature-disabled-container">
						<div className="feature-disabled-alert text-error">
							<Icon name="warning" />
							<span className="feature-disabled-text">
								{hasMessage(featureDisabledTextKey)
									? getMessage(featureDisabledTextKey)
									: getMessage("settings.features.defaultDisabledNote")}
							</span>
						</div>
						{feature.supportedTargets && (
							<div className="feature-supported-targets text">
								{getMessage("settings.features.supportedTargets", {
									browsers: unitListFormat.format(feature.supportedTargets),
								})}
							</div>
						)}
					</div>
					<Divider />
				</>
			)}
			<div className="feature-name-container">
				{feature.storageKeys && (
					<ItemContextMenu
						containerClassName="feature-context-menu"
						includeContextMenuClassName
					>
						<button
							type="button"
							onClick={() => {
								Promise.all([
									feature.storageKeys?.main &&
										storage.remove(feature.storageKeys.main),
									feature.storageKeys?.localStorage?.map((key) =>
										globalThis.localStorage.removeItem(
											`${LOCALSTORAGE_PREFIX}${key}`,
										),
									),
									feature.storageKeys?.session &&
										removeExtensionSessionStorage(feature.storageKeys.session),
								])
									.then(() =>
										success(
											getMessage("settings.features.clearStorage.success"),
										),
									)
									.catch(() =>
										error(getMessage("settings.features.clearStorage.error")),
									);
							}}
						>
							{getMessage("settings.features.clearStorage")}
						</button>
					</ItemContextMenu>
				)}
				<div className="btn-toggle-label">
					<FeatureTypeLabel feature={feature} />
					{hasMessage(featureNameKey) ? getMessage(featureNameKey) : feature.id}
				</div>
				{featureComponent}
			</div>
			{hasMessage(featureDescriptionKey) && (
				<>
					<Divider />
					<div className="feature-description-container">
						<div className="text-description feature-description">
							{
								// biome-ignore lint/suspicious/noExplicitAny: Fine
								getMessage(featureDescriptionKey, descriptionValues as any)
							}
						</div>
					</div>
				</>
			)}
			{feature.btns && (
				<>
					<Divider />
					<div className="feature-btns-container">
						{feature.btns.map((btn) => {
							const btnKey = `${I18N_FEATURE_PREFIX}${feature.id}.btns.${btn.id}`;

							return (
								<Button
									key={btn.id}
									className="feature-btn"
									type={btn.type}
									as="a"
									href={btn.href}
									target="_blank"
								>
									{hasMessage(btnKey) ? getMessage(btnKey) : btn.id}
								</Button>
							);
						})}
					</div>
				</>
			)}
			{feature.permissions && (
				<div className="feature-permissions-container">
					<h3>{getMessage("settings.features.permissions")}</h3>
					{import.meta.env.TARGET_BASE === "firefox" ? (
						<FeaturePermissions feature={feature} showError={showError} />
					) : (
						<FeaturePermissionsContainer feature={feature} showError={showError} />
					)}
				</div>
			)}
			{displayedSubfeatures && displayedSubfeatures.length > 0 && (
				<>
					{!feature.subfeatures?.showAsList && <Divider />}
					<div
						className={classNames("subfeatures-section section", {
							"as-list": feature.subfeatures?.showAsList,
						})}
					>
						{displayedSubfeatures.map((subfeature) => (
							<FeatureContainer
								feature={subfeature}
								key={subfeature.id}
								asSection={!feature.subfeatures?.showAsList}
								keyword={keyword}
							/>
						))}
					</div>
					{feature.subfeatures?.showAsList && <Divider />}
				</>
			)}
		</div>
	);
}
