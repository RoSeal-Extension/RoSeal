import type { Signal } from "@preact/signals";
import { useMemo } from "preact/hooks";
import type { AvatarColors3s } from "src/ts/helpers/requests/services/avatar";
import { normalizeColor } from "src/ts/utils/colors";
import { BodyColorAdvanced } from "./BodyColorAdvanced";

export type SetBodyColorsProps = {
	bodyColors: Signal<AvatarColors3s>;
};

export default function SetBodyColors({ bodyColors }: SetBodyColorsProps) {
	const color = useMemo(() => {
		return Object.values(bodyColors.value).every((value, _, arr) => value === arr[0])
			? normalizeColor(bodyColors.value.headColor3, true)
			: "#ffffff";
	}, [bodyColors.value]);

	const setColor = (_value: string) => {
		if (_value === color) {
			return;
		}
		const value = normalizeColor(_value);
		bodyColors.value = {
			headColor3: value,
			leftArmColor3: value,
			rightArmColor3: value,
			rightLegColor3: value,
			leftLegColor3: value,
			torsoColor3: value,
		};
	};

	return <BodyColorAdvanced color={color} setColor={setColor} />;
}
