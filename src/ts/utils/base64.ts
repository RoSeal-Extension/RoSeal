export function arrayBufferToDataURL(arrayBuffer: ArrayBuffer, mimeType: string) {
	return new Promise<string>((resolve) => {
		const blob = new Blob([arrayBuffer], { type: mimeType });
		const reader = new FileReader();

		reader.onload = (e) => resolve((e?.target?.result as string | undefined) ?? "");

		reader.readAsDataURL(blob);
	});
}
