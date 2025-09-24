import classNames from "classnames";

export type FileUploadProps = {
	disabled?: boolean;
	className?: string;
	format: string;
	handleFileData: (file?: File) => void;
};

export default function FileUpload({
	disabled,
	className,
	format,
	handleFileData,
}: FileUploadProps) {
	return (
		<input
			type="file"
			className={classNames("roseal-file-input", className, {
				"roseal-disabled": disabled,
			})}
			accept={format}
			disabled={disabled}
			onChange={(e) => {
				handleFileData(e.currentTarget?.files?.[0]);
			}}
		/>
	);
}
