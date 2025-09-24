import tinycolor from "tinycolor2";
import color, { type ColorFormats } from "tinycolor2";

export function getClosestHexColor<
	T extends {
		rgb: ColorFormats.RGB;
	},
>(palette: T[], hex: string) {
	const target = color(hex).toRgb();
	return palette.reduce((prev, curr) => {
		const rgb = curr.rgb;
		const prevRgb = prev.rgb;

		const prevDistance =
			(target.r - prevRgb.r) ** 2 + (target.g - prevRgb.g) ** 2 + (target.b - prevRgb.b) ** 2;
		const distance =
			(target.r - rgb.r) ** 2 + (target.g - rgb.g) ** 2 + (target.b - rgb.b) ** 2;
		return distance < prevDistance ? curr : prev;
	});
}

export function compareColor(color1: number, color2: number) {
	return Math.abs(color1 - color2) <= 20;
}

export function rgbToHex(color: [number, number, number]) {
	return `#${tinycolor({
		r: color[0],
		g: color[1],
		b: color[2],
	}).toHex()}`;
}

export function hexToRgb(hex: string) {
	const rgb = tinycolor(hex).toRgb();
	return [rgb.r, rgb.g, rgb.b] as [number, number, number];
}

export function normalizeColor(color: string, prepend?: boolean) {
	return `${prepend ? "#" : ""}${color.toLowerCase().replaceAll("#", "")}`;
}
