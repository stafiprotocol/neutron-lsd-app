import { Box, Modal } from "@mui/material";
import classNames from "classnames";
import { PrimaryLoading } from "components/common/PrimaryLoading";
import { Icomoon } from "components/icon/Icomoon";
import { lsdTokenChainConfig } from "config/chain";
import { roboto } from "config/font";
import { useAppDispatch, useAppSelector } from "hooks/common";
import Image from "next/image";
import errorIcon from "public/images/tx_error.png";
import successIcon from "public/images/tx_success.png";
import { useMemo } from "react";
import { setBridgeLoadingParams } from "redux/reducers/AppSlice";
import { formatNumber } from "utils/numberUtils";

export const BridgeLoadingModal = () => {
  const dispatch = useAppDispatch();

  const { bridgeLoadingParams, darkMode } = useAppSelector(
    (state) => state.app
  );

  const secondaryMsg = useMemo(() => {
    return bridgeLoadingParams?.status === "success"
      ? `${Number(bridgeLoadingParams?.tokenAmount)} ${
          lsdTokenChainConfig.lsdTokenName
        } swapped from ${bridgeLoadingParams?.srcChain?.chainName} to ${
          bridgeLoadingParams?.dstChain?.chainName
        }`
      : bridgeLoadingParams?.status === "error"
      ? bridgeLoadingParams?.displayMsg ||
        "Something went wrong, please try again"
      : bridgeLoadingParams?.displayMsg
      ? bridgeLoadingParams?.displayMsg
      : `You will receive ${formatNumber(bridgeLoadingParams?.tokenAmount)} ${
          bridgeLoadingParams?.dstChain?.chainName
        } ${lsdTokenChainConfig.lsdTokenName}`;
  }, [bridgeLoadingParams]);

  const closeModal = () => {
    if (bridgeLoadingParams?.status !== "loading") {
      dispatch(setBridgeLoadingParams(undefined));
    } else {
      dispatch(setBridgeLoadingParams({ modalVisible: false }));
    }
  };

  return (
    <Modal
      open={bridgeLoadingParams?.modalVisible === true}
      onClose={closeModal}
    >
      <Box
        pt="0"
        sx={{
          backgroundColor: darkMode ? "#38475D" : "#ffffff",
          width: "3.5rem",
          borderRadius: "0.16rem",
          outline: "none",
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          className={classNames(
            "flex-1 flex flex-col items-center",
            darkMode ? "dark" : "",
            roboto.className
          )}
        >
          <div
            className={classNames(
              "mr-[.24rem] self-end mt-[.24rem] cursor-pointer"
            )}
            onClick={closeModal}
          >
            <Icomoon
              icon="close"
              size=".16rem"
              color={darkMode ? "#FFFFFF80" : "#6C86AD80"}
            />
          </div>

          {(bridgeLoadingParams?.status === "loading" ||
            !bridgeLoadingParams?.status) && (
            <div className="mt-[.0rem] w-[.8rem] h-[.8rem]">
              <PrimaryLoading size=".8rem" />
            </div>
          )}

          {bridgeLoadingParams?.status === "success" && (
            <div className="mt-[.0rem] w-[.8rem] h-[.8rem] relative">
              <Image src={successIcon} alt="success" layout="fill" />
            </div>
          )}

          {bridgeLoadingParams?.status === "error" && (
            <div className="mt-[.0rem] w-[.8rem] h-[.8rem] relative">
              <Image src={errorIcon} alt="error" layout="fill" />
            </div>
          )}

          <div
            className={classNames(
              "mx-[.36rem] mt-[.24rem] text-[.24rem] text-color-text1 font-[700] text-center leading-tight"
            )}
          >
            {bridgeLoadingParams?.status === "success"
              ? `Swap Success`
              : bridgeLoadingParams?.status === "error"
              ? "Swap Failed"
              : `You are now swapping ${Number(
                  bridgeLoadingParams?.tokenAmount
                )} ${lsdTokenChainConfig.lsdTokenName} from ${
                  bridgeLoadingParams?.srcChain?.chainName
                } to ${bridgeLoadingParams?.dstChain?.chainName}`}
          </div>

          <div
            className={classNames(
              "mx-[.36rem] mt-[.2rem] mb-[.32rem] leading-tight text-center text-[.16rem] text-color-text2"
            )}
            style={{
              WebkitLineClamp: 3,
              lineClamp: 3,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              wordBreak: "break-word",
            }}
          >
            {secondaryMsg}
          </div>

          {bridgeLoadingParams?.scanUrl && (
            <a
              className="mb-[.32rem] flex items-center"
              href={bridgeLoadingParams?.scanUrl || ""}
              target="_blank"
              rel="noreferrer"
            >
              <span className="text-color-link text-[.16rem] mr-[.12rem] font-[500]">
                View on explorer
              </span>

              <Icomoon
                icon="right"
                size=".12rem"
                color={darkMode ? "#ffffff" : "#5A5DE0"}
              />
            </a>
          )}
        </div>
      </Box>
    </Modal>
  );
};
