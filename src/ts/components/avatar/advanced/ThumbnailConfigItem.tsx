import classNames from "classnames";
import type { THUMBNAIL_CUSTOMIZATION_LIMITS } from "src/ts/constants/avatar";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import type { ThumbnailCustomization } from "src/ts/helpers/requests/services/avatar";
import Slider from "../../core/Slider";
import type { AdvancedAvatarViewType } from "../AdvancedCustomizationButton";
import type { thumbnailConfigFieldNames } from "./ThumbnailsCustomization";
import { useState } from "preact/hooks";
import IconButton from "../../core/IconButton";
import TextInput from "../../core/TextInput";

export type ThumbnailConfigItemProps<T extends Exclude<AdvancedAvatarViewType, "AvatarBust">> = {
	viewType: T;
	name: (typeof thumbnailConfigFieldNames)[number];
	customizationLimit: (typeof THUMBNAIL_CUSTOMIZATION_LIMITS)[T];
	isEnabled: boolean;
	thumbnailConfiguration: ThumbnailCustomization;
	updateThumbnailConfiguration: (req?: ThumbnailCustomization) => void;
	updateThumbnailConfigurationLocally: (req: ThumbnailCustomization) => void;
};

export default function ThumbnailConfigItem<
	T extends Exclude<AdvancedAvatarViewType, "AvatarBust">,
>({
	viewType,
	name,
	thumbnailConfiguration,
	customizationLimit,
	isEnabled,
	updateThumbnailConfiguration,
	updateThumbnailConfigurationLocally,
}: ThumbnailConfigItemProps<T>) {
	const [editing, setEditing] = useState(false);

	const value = name === "distanceScale" && !isEnabled ? 1 : thumbnailConfiguration.camera[name];

	const valueLabel =
		name === "distanceScale"
			? asLocaleString(value, {
					style: "percent",
				})
			: asLocaleString(+value, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
					style: "unit",
					unit: "degree",
				});

	const min = customizationLimit.lowerBounds[name];
	const max = customizationLimit.upperBounds[name];

	return (
		<div
			className={classNames("config-section", {
				"roseal-disabled":
					(viewType === "Avatar" && name === "distanceScale") || !isEnabled,
			})}
			key={name}
		>
			<div className="section-label">
				<div className="title-label">
					<span className="title-label-text">
						{getMessage(`avatar.advanced.thumbnails.${name}`)}
					</span>
				</div>
				{editing ? (
					<TextInput
						type="number"
						className="value-input"
						placeholder={valueLabel}
						min={min}
						max={max}
						onChange={(value) => {
							updateThumbnailConfiguration({
								...thumbnailConfiguration,
								camera: {
									...thumbnailConfiguration.camera,
									[name]: Number.parseFloat(value),
								},
							});
						}}
						step={1}
						value={value}
					/>
				) : (
					<div className="value-label">{valueLabel}</div>
				)}
				<IconButton iconName="edit" size="sm" onClick={() => setEditing(!editing)} />
			</div>
			<Slider
				min={min}
				max={max}
				step={1}
				value={value}
				onUpdate={(value) => {
					updateThumbnailConfigurationLocally({
						...thumbnailConfiguration,
						camera: {
							...thumbnailConfiguration.camera,
							[name]: value,
						},
					});
				}}
				onFinalUpdate={() => updateThumbnailConfiguration()}
			/>
		</div>
	);
}
