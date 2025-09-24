export const USERNAME_COLORS = [
	"#fd2943", // Bright red
	"#01a2ff", // Bright blue
	"#02b857", // Earth green
	"#6b327c", // Bright violet
	"#da8541", // Bright orange
	"#f5cd30", // Bright yellow
	"#e8bac8", // Light reddish violet
	"#d7c59a", // Brick yellow
];

function getNameValue(pName: string) {
	let value = 0;
	for (let index = 0; index < pName.length; index++) {
		let cValue = pName.charCodeAt(index);
		let reverseIndex = pName.length - index;
		if (pName.length % 2 === 1) {
			reverseIndex -= 1;
		}
		if (reverseIndex % 4 >= 2) {
			cValue = -cValue;
		}
		value += cValue;
	}
	return value;
}

const colorOffset = 0;

export function computeUsernameExperienceChatColor(pName: string) {
	const index = (getNameValue(pName) + colorOffset) % USERNAME_COLORS.length;

	return USERNAME_COLORS[(index + USERNAME_COLORS.length) % USERNAME_COLORS.length]; // ensures non-negative
}
