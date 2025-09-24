import classNames from "classnames";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type FileUploadBoxProps = {
	disabled?: boolean;
	className?: string;
	format: string;
	handleFileData: (file: File) => void;
	slim?: boolean;
};

export default function FileUploadBox({
	disabled,
	className,
	format,
	handleFileData,
	slim,
}: FileUploadBoxProps) {
	return (
		<div
			className={classNames("roseal-file-upload-container", className, {
				disabled,
				slim,
			})}
			onDragOver={(e) => {
				e.preventDefault();
			}}
			onDrop={(e) => {
				e.preventDefault();
				const file = e.dataTransfer?.files[0];

				if (file) {
					handleFileData(file);
				}
			}}
		>
			<div className="file-upload-widget">
				<div className="file-upload-content">
					<div className="instruction-container full">
						<div>
							{getMessage("fileUpload.dragMessage", {
								instructionText: (contents: string) => (
									<p className="instruction-text">{contents}</p>
								),
								textOnLine: (contents: string) => (
									<p className="text-on-line">{contents}</p>
								),
								span: (contents: string) => <span>{contents}</span>,
							})}
						</div>
						<input
							type="file"
							name="file"
							id="selectFile"
							className="hidden file-upload-elem"
							accept={format}
							onChange={(e) => {
								const file = e.currentTarget?.files?.[0];

								if (file) {
									handleFileData(file);
								}
							}}
						/>
						<label for="selectFile" className="btn-control-sm btn-action file-btn">
							{getMessage("fileUpload.selectMessage")}
						</label>
					</div>
				</div>
			</div>
		</div>
	);
}
