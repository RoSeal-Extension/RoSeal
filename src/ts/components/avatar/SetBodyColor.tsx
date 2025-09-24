import type { Signal } from "@preact/signals";
import { useMemo } from "preact/hooks";
import type { AvatarColors3s } from "src/ts/helpers/requests/services/avatar";
import { normalizeColor } from "src/ts/utils/colors";
import { BodyColorAdvanced } from "./BodyColorAdvanced";

export type SetBodyColorProps = {
	selectedPart: Signal<keyof AvatarColors3s | "all">;
	bodyColors: Signal<AvatarColors3s>;
};

export default function SetBodyColor({ selectedPart, bodyColors }: SetBodyColorProps) {
	const color = useMemo(() => {
		if (selectedPart.value === "all") {
			return Object.values(bodyColors.value).every((value, _, arr) => value === arr[0])
				? normalizeColor(bodyColors.value.headColor3, true)
				: "#ffffff";
		}

		return normalizeColor(bodyColors.value[selectedPart.value], true);
	}, [selectedPart.value, bodyColors.value]);

	const setColor = (_value: string) => {
		if (_value === color) {
			return;
		}
		const value = normalizeColor(_value);
		if (selectedPart.value === "all") {
			bodyColors.value = {
				headColor3: value,
				leftArmColor3: value,
				rightArmColor3: value,
				rightLegColor3: value,
				leftLegColor3: value,
				torsoColor3: value,
			};
		} else {
			bodyColors.value = {
				...bodyColors.value,
				[selectedPart.value]: value,
			};
		}
	};

	return <BodyColorAdvanced color={color} setColor={setColor} />;
}
