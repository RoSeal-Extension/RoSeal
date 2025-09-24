import { isEmojiSupported } from "is-emoji-supported";

export async function checkEmojiSupport(emoji: string) {
	return isEmojiSupported(emoji);
}
