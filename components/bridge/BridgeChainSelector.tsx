import { Popover } from "@mui/material";
import classNames from "classnames";
import { Icomoon } from "components/icon/Icomoon";
import { useAppSelector } from "hooks/common";
import { useAppSlice } from "hooks/selector";
import { ChainConfig } from "interfaces/common";
import {
  bindPopover,
  bindTrigger,
  usePopupState,
} from "material-ui-popup-state/hooks";
import Image from "next/image";
import { useMemo } from "react";

interface BridgeChainSelectorProps {
  isFrom?: boolean;
  options: ChainConfig[];
  selectedChain: ChainConfig | undefined;
  onChange: (chain: ChainConfig) => void;
}

export const BridgeChainSelector = (props: BridgeChainSelectorProps) => {
  const { options, selectedChain, onChange, isFrom } = props;

  const { darkMode } = useAppSelector((state) => state.app);

  const selectionPopupState = usePopupState({
    variant: "popover",
    popupId: "selection",
  });

  return (
    <>
      <div
        className={classNames(
          "mt-[.06rem] flex items-center rounded-[.3rem] h-[.42rem] justify-between",
          options.length > 0 ? "cursor-pointer" : "cursor-default",
          selectionPopupState.isOpen ? "bg-color-selected" : "bg-color-bg2"
        )}
        // style={{
        //   backdropFilter: "blue(.4rem)",
        //   ...(selectionPopupState.isOpen
        //     ? {
        //         background:
        //           "linear-gradient(0deg,rgba(0, 243, 171, 0.1) 0%,rgba(26, 40, 53, 0.16) 70%,rgba(26, 40, 53, 0.2) 100%)",
        //       }
        //     : {}),
        // }}
        {...(options.length > 0 ? bindTrigger(selectionPopupState) : {})}
      >
        <div className="flex items-center">
          <div
            className={classNames(
              "w-[.34rem] h-[.34rem] relative ml-[.04rem] rounded-full overflow-hidden",
              selectedChain ? "" : "invisible"
            )}
          >
            <Image src={selectedChain?.icon || ""} alt="logo" layout="fill" />
          </div>

          {selectedChain ? (
            <div
              className={classNames(
                "ml-[.08rem] min-w-[1.4rem] text-[.16rem]",
                selectionPopupState.isOpen ? "text-text1" : "text-color-text1"
              )}
            >
              {selectedChain.chainName}
            </div>
          ) : (
            <div
              className={classNames(
                "ml-[.08rem] min-w-[1.4rem] text-[.14rem]",
                selectionPopupState.isOpen ? "text-text2" : "text-color-text2"
              )}
            >
              Choose a Chain
            </div>
          )}
        </div>

        <div className="ml-[.12rem] mr-[.16rem]">
          <Icomoon icon="arrow-down" size=".1rem" color="#848B97" />
        </div>
      </div>

      {/* Notice */}
      <Popover
        {...bindPopover(selectionPopupState)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        elevation={0}
        sx={{
          marginTop: ".15rem",
          "& .MuiPopover-paper": {
            background: darkMode ? "#6C86AD4D" : "#ffffff80",
            border: darkMode
              ? "0.01rem solid #6C86AD80"
              : "0.01rem solid #FFFFFF",
            backdropFilter: "blur(.4rem)",
            borderRadius: ".3rem",
          },
          "& .MuiTypography-root": {
            padding: "0px",
          },
          "& .MuiBox-root": {
            padding: "0px",
          },
        }}
        aria-hidden={false}
      >
        <div className={classNames("w-[3rem]", darkMode ? "dark" : "")}>
          <div className="text-color-text1 text-[.16rem] mt-[.2rem] ml-[.12rem] mb-[.1rem]">
            {props.isFrom ? "Send From" : "Send To"}
          </div>
          {options.map((item, index) => (
            <div key={index}>
              <div
                className="flex items-center justify-between h-[.5rem] cursor-pointer mx-[.12rem]"
                onClick={() => {
                  selectionPopupState.close();
                  props.onChange(item);

                  // router.replace({
                  //   pathname: router.pathname,
                  //   query: {
                  //     ...router.query,
                  //     tokenStandard: item,
                  //   },
                  // });
                }}
              >
                <div className="flex items-center ">
                  <div className="w-[.2rem] h-[.2rem] relative rounded-full overflow-hidden">
                    <Image alt="logo" layout="fill" src={item.icon || ""} />
                  </div>
                  <div className="ml-[.06rem] text-color-text1 text-[.14rem]">
                    {item.chainName}
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="text-color-text1 text-[.14rem]"></div>

                  <div className="ml-[.12rem]">
                    {selectedChain === item ? (
                      <Icomoon
                        icon="checked-circle"
                        size=".16rem"
                        color="#5A5DE0"
                      />
                    ) : (
                      <div className="w-[.16rem] h-[.16rem] rounded-full border-solid border-[1px] border-color-border3" />
                    )}
                  </div>
                </div>
              </div>

              {index !== options.length - 1 && (
                <div className="h-[1px] mx-[.12rem] bg-color-divider2" />
              )}
            </div>
          ))}
        </div>
      </Popover>
    </>
  );
};
