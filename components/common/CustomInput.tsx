import classNames from "classnames";
import { roboto, robotoBold } from "config/font";

interface CustomInputProps {
  placeholder: string;
  disabled?: boolean;
  fontSize?: string;
  primary?: boolean;
  light?: boolean;
  value: string;
  bold?: boolean;
  handleValueChange: (value: string) => void;
}

export const CustomInput = (props: CustomInputProps) => {
  return (
    <input
      disabled={props.disabled}
      className={classNames(
        "w-full bg-transparent border-none outline-none",
        props.light
          ? "text-text-black1 placeholder:text-text2"
          : props.primary
          ? "text-primary placeholder:text-placdholder-primary"
          : "text-color-text1 placeholder:text-text2/50 dark:placeholder:text-text2Dark/50",
        props.bold ? robotoBold.className : roboto.className
      )}
      style={{
        fontSize: props.fontSize ? `${props.fontSize}` : ".2rem",
      }}
      value={props.value}
      placeholder={props.placeholder}
      onChange={(e) => {
        let value = e.target.value;
        props.handleValueChange(value);
      }}
    />
  );
};
