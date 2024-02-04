import { Tooltip, styled } from "@mui/material";
import classNames from "classnames";
import { Icomoon } from "components/icon/Icomoon";
import { useAppSlice } from "hooks/selector";

interface MyTooltipProps {
  title: string;
  text: string;
  color?: string;
  hideQuestionIcon?: boolean;
  cursorPointer?: boolean;
  className?: string;
  maxLines?: number;
  fontSize?: string;
}

const CustomTooltip = (props: MyTooltipProps) => {
  const { darkMode } = useAppSlice();

  return (
    <Tooltip
      title={props.title}
      placement="top"
      componentsProps={{
        tooltip: {
          sx: {
            color: darkMode ? "#FFFFFF80" : "#6C86AD",
            background: darkMode ? "#6C86AD4D" : "#ffffff80",
            border: darkMode
              ? "0.01rem solid #6C86AD80"
              : "0.01rem solid #FFFFFF",
            backdropFilter: "blur(.4rem)",
            borderRadius: ".06rem",
            lineHeight: 1.4,
            fontSize: ".14rem",
          },
        },
      }}
      sx={{
        // color: darkMode ? "#222C3C" : "#E8EFFD",
        fontSize: ".12rem",
        marginBottom: 0,
        "& .MuiTooltip-popover": {
          marginBottom: 0,
        },
      }}
      PopperProps={{
        // sx: {
        //   maxHeight: "2.5rem",
        //   overflow: "auto",
        //   backgroundColor: darkMode ? "#222C3C" : "#E8EFFD",
        // },
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [0, -5],
            },
          },
        ],
      }}
    >
      <div
        className={classNames(
          "flex items-center,",
          props.cursorPointer ? "cursor-pointer" : "cursor-default",
          props.className || ""
        )}
      >
        <div
          className="break-all"
          style={
            props.maxLines
              ? {
                  maxLines: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  WebkitLineClamp: 2,
                  lineClamp: 2,
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  fontSize: props.fontSize || ".14rem",
                }
              : { fontSize: props.fontSize || ".14rem" }
          }
        >
          {props.text}
        </div>

        {!props.hideQuestionIcon && (
          <div className="flex items-center ml-[.08rem]">
            <Icomoon
              icon="question"
              size="0.16rem"
              color={props.color || darkMode ? "#FFFFFF80" : "#6C86AD80"}
            />
          </div>
        )}
      </div>
    </Tooltip>
  );
};

export const MyTooltip = styled(CustomTooltip)(({ theme }) => ({
  // backgroundColor: "#ff0000",
  // color: "rgba(0, 0, 0, 0.87)",
  // border: "1px solid #dadde9",
}));
