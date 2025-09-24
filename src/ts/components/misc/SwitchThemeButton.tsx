import Tooltip from "../core/Tooltip";
import MdOutlineLightMode from "@material-symbols/svg-400/outlined/light_mode-fill.svg";
import MdOutlineDarkMode from "@material-symbols/svg-400/outlined/dark_mode-fill.svg";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { useTheme } from "../hooks/useTheme";

export default function SwitchThemeButton() {
	const [theme, setTheme] = useTheme();

	return (
		<Tooltip
			placement="bottom"
			as="li"
			containerId="dev-theme-switcher"
			containerClassName="navbar-icon-item"
			includeContainerClassName={false}
			button={
				<button
					type="button"
					className="btn-generic-navigation"
					onClick={() => {
						setTheme(theme === "light" ? "dark" : "light");
					}}
				>
					<span id="nav-theme-icon" className="rbx-menu-item">
						{theme === "dark" ? (
							<MdOutlineDarkMode className="roseal-icon" />
						) : (
							<MdOutlineLightMode className="roseal-icon" />
						)}
					</span>
				</button>
			}
		>
			{getMessage(`switchTheme.${theme}`)}
		</Tooltip>
	);
}
