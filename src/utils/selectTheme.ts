import { GroupBase, StylesConfig, Theme } from "react-select";
import { SelectValue } from "../App";

// react-select paints itself from its own palette rather than the stylesheet,
// so the dark grey colours have to be handed to it directly
const darkSelectTheme = (theme: Theme): Theme => ({
  ...theme,
  colors: {
    ...theme.colors,
    primary: "#d9a04a", // selected option
    primary75: "#c08a38",
    primary50: "#3a3a39", // option being clicked
    primary25: "#2d2d2d", // hovered or keyboard-focused option
    neutral0: "#20201f", // control and menu background
    neutral5: "#1b1b1a",
    neutral10: "#2d2d2d",
    neutral20: "#343434", // border, dropdown arrow, separator
    neutral30: "#454545", // hovered border
    neutral40: "#8f8e87",
    neutral50: "#8f8e87", // placeholder
    neutral60: "#f0efec",
    neutral70: "#f0efec",
    neutral80: "#f0efec", // typed and selected text
    neutral90: "#ffffff",
  },
});

const darkSelectStyles: StylesConfig<SelectValue, false, GroupBase<SelectValue>> = {
  menu: (provided) => ({
    ...provided,
    border: "1px solid #343434",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
  }),
};

export { darkSelectTheme, darkSelectStyles };
