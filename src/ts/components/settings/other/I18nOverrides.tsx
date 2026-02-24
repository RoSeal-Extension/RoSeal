import { useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import FileUpload from "../../core/FileUpload";
import Button from "../../core/Button";
import classNames from "classnames";
import { setLocalSessionStorage } from "src/ts/helpers/storage";
import { CUSTOM_I18N_OVERRIDE_LOCALSESSIONSTORAGE_KEY } from "src/ts/constants/i18n";
import { getCrowdinProjectLink } from "src/ts/utils/links";
import { CROWDIN_PROJECT_ID } from "src/ts/constants/rosealSettings";
import Icon from "../../core/Icon";

export default function I18nOverrides() {
	const [isOpen, setIsOpen] = useState(false);
	const [importFile, setImportFile] = useState<File>();

	const [readImportData, setReadImportData] = useState(false);
	const [hasImportError, setHasImportError] = useState(false);
	const [readingImportData, setReadingImportData] = useState(false);

	return (
		<div className="section i18n-overrides-section">
			<div className="container-header" onClick={() => setIsOpen(!isOpen)}>
				<h2>{getMessage("settings.management.i18nOverrides.title")}</h2>
				<Icon name={isOpen ? "up" : "down"} size="16x16" />
			</div>
			{isOpen && (
				<div className="section">
					<p>
						{getMessage("settings.management.i18nOverrides.description", {
							crowdinLink: (contents: string) => (
								<a
									href={getCrowdinProjectLink(CROWDIN_PROJECT_ID)}
									target="_blank"
									rel="noreferrer"
									className="text-link"
								>
									{contents}
								</a>
							),
						})}
					</p>
					<div className="file-upload-container">
						<div className="file-upload-section">
							<FileUpload format=".json" handleFileData={setImportFile} />
							<Button
								type="secondary"
								disabled={!importFile || readingImportData}
								className="import-messages-btn"
								onClick={() => {
									setReadingImportData(true);
									setHasImportError(false);
									setReadImportData(false);

									importFile
										?.text()
										.then(async (text) => {
											const data = JSON.parse(text) as Record<
												string,
												{
													defaultMessage: string;
													description?: string;
												}
											>;
											const newData: Record<string, string> = {};

											for (const key in data) {
												newData[key] = data[key].defaultMessage;
											}

											setLocalSessionStorage(
												CUSTOM_I18N_OVERRIDE_LOCALSESSIONSTORAGE_KEY,
												newData,
											);
										})
										.then(() => false)
										.catch(() => true)
										.then((error) => {
											setHasImportError(error);
											setReadImportData(true);
											setReadingImportData(false);
										});
								}}
							>
								{getMessage("settings.management.i18nOverrides.btns.import")}
							</Button>
						</div>
					</div>
					{readImportData && (
						<span
							className={classNames("import-i18n-text", {
								"text-success": !hasImportError,
								"text-error": hasImportError,
							})}
						>
							{getMessage(
								`settings.management.i18nOverrides.${hasImportError ? "error" : "success"}`,
							)}
						</span>
					)}
				</div>
			)}
		</div>
	);
}
