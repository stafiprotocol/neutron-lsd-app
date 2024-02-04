import { Box, Modal } from "@mui/material";
import classNames from "classnames";
import { PrimaryLoading } from "components/common/PrimaryLoading";
import { Icomoon } from "components/icon/Icomoon";
import { neutronChainConfig } from "config/chain";
import { roboto } from "config/font";
import { useAppDispatch, useAppSelector } from "hooks/common";
import { useCosmosChainAccount } from "hooks/useCosmosChainAccount";
import Image from "next/image";
import { useRouter } from "next/router";
import errorIcon from "public/images/tx_error.png";
import successIcon from "public/images/tx_success.png";
import { useEffect, useMemo, useState } from "react";
import {
  resetRedelegateLoadingParams,
  updateRedelegateLoadingParams,
} from "redux/reducers/AppSlice";
import { RootState } from "redux/store";
import { getLsdTokenName, getTokenName } from "utils/configUtils";
import { formatNumber } from "utils/numberUtils";
import snackbarUtil from "utils/snackbarUtils";
import { RedelegateLoadingProgressItem } from "./RedelegateLoadingProgressItem";

export const RedelegateLoadingModal = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showDetail, setShowDetail] = useState(false);
  const neutronChainAccount = useCosmosChainAccount(neutronChainConfig.chainId);

  const { redelegateLoadingParams, darkMode } = useAppSelector(
    (state: RootState) => {
      return {
        redelegateLoadingParams: state.app.redelegateLoadingParams,
        darkMode: state.app.darkMode,
      };
    }
  );

  const title = useMemo(() => {
    return redelegateLoadingParams?.customTitle
      ? redelegateLoadingParams.customTitle
      : redelegateLoadingParams?.status === "success"
      ? `Your new balance is ${formatNumber(
          redelegateLoadingParams?.newRTokenBalance
        )} ${getLsdTokenName()}`
      : redelegateLoadingParams?.status === "error"
      ? "Transaction Failed"
      : `You are now liquid staking ${redelegateLoadingParams?.amount} ${
          redelegateLoadingParams?.type === "staked" ? "Staked" : "LSM"
        } ${getTokenName()}`;
  }, [redelegateLoadingParams]);

  const secondaryMsg = useMemo(() => {
    return redelegateLoadingParams?.customMsg
      ? redelegateLoadingParams.customMsg
      : redelegateLoadingParams?.status === "success"
      ? `Liquid staking operation was successful, you will get ${formatNumber(
          redelegateLoadingParams?.willReceiveAmount,
          { fixedDecimals: false }
        )} rATOM`
      : redelegateLoadingParams?.status === "error"
      ? redelegateLoadingParams?.displayMsg ||
        "Something went wrong, please try again"
      : redelegateLoadingParams?.displayMsg ||
        `Liquid staking ${
          redelegateLoadingParams?.amount
        } ${getTokenName()}, you will receive ${formatNumber(
          redelegateLoadingParams?.willReceiveAmount
        )} 
  ${getLsdTokenName()}${
          redelegateLoadingParams?.type === "staked"
            ? `, overall 2 transactions are requested for liquid staking operation`
            : ""
        }`;
  }, [redelegateLoadingParams]);

  useEffect(() => {
    setShowDetail(false);
  }, [redelegateLoadingParams?.modalVisible]);

  const closeModal = () => {
    if (redelegateLoadingParams?.status !== "loading") {
      dispatch(resetRedelegateLoadingParams(undefined));
    } else {
      dispatch(updateRedelegateLoadingParams({ modalVisible: false }));
    }
  };

  const clickRetry = () => {
    console.log(redelegateLoadingParams);
    if (
      !redelegateLoadingParams ||
      !redelegateLoadingParams.currentStep ||
      !redelegateLoadingParams.chainId ||
      !redelegateLoadingParams.noticeUuid
    ) {
      return;
    }
    const { currentStep, chainId, noticeUuid, cosmosTxMessagesJSON } =
      redelegateLoadingParams;

    if (currentStep === "sending") {
      if (!cosmosTxMessagesJSON) {
        snackbarUtil.error("Invalid parameters, please retry manually");
        return;
      }
      if (!neutronChainAccount) {
        snackbarUtil.error("Please connect wallet first");
        return;
      }
      // dispatch(
      //   redelegateStafiHubTokenSendAction(
      //     noticeUuid,
      //     neutronChainAccount.bech32Address,
      //     chainId,
      //     JSON.parse(cosmosTxMessagesJSON)
      //   )
      // );
    }
  };

  return (
    <Modal
      // open={true}
      open={redelegateLoadingParams?.modalVisible === true}
      onClose={closeModal}
      sx={
        {
          // backgroundColor: "#0A131Bba",
        }
      }
    >
      <Box
        pt="0"
        sx={{
          backgroundColor: darkMode ? "#38475D" : "#ffffff",
          width: showDetail ? "5.8rem" : "3.5rem",
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

          {(redelegateLoadingParams?.status === "loading" ||
            !redelegateLoadingParams?.status) && (
            <div className="mt-[.0rem] w-[.8rem] h-[.8rem]">
              <PrimaryLoading size=".8rem" />
            </div>
          )}

          {redelegateLoadingParams?.status === "success" && (
            <div className="mt-[.0rem] w-[.8rem] h-[.8rem] relative">
              <Image src={successIcon} alt="success" layout="fill" />
            </div>
          )}

          {redelegateLoadingParams?.status === "error" && (
            <div className="mt-[.0rem] w-[.8rem] h-[.8rem] relative">
              <Image src={errorIcon} alt="error" layout="fill" />
            </div>
          )}

          <div
            className={classNames(
              "mx-[.36rem] mt-[.24rem] text-[.24rem] text-color-text1 font-[700] text-center leading-tight"
            )}
          >
            {title}
          </div>

          <div
            className={classNames(
              "mx-[.36rem] mt-[.2rem] mb-[.32rem] leading-tight text-center text-[.16rem] text-color-text2 "
            )}
            style={{
              WebkitLineClamp: 5,
              lineClamp: 5,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              wordBreak: "break-word",
            }}
          >
            {secondaryMsg}
          </div>

          {redelegateLoadingParams?.progressDetail?.tokenizeShares
            ?.totalStatus === "error" ||
          redelegateLoadingParams?.progressDetail?.sending?.totalStatus ===
            "error" ? (
            <div
              className="mb-[.32rem] text-color-link text-[.16rem] cursor-pointer"
              onClick={clickRetry}
            >
              Retry
            </div>
          ) : (
            redelegateLoadingParams?.scanUrl && (
              <a
                className="mb-[.32rem] flex items-center"
                href={redelegateLoadingParams?.scanUrl || ""}
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
            )
          )}

          <div
            className={classNames(
              "h-[.5rem] rounded-b-[.16rem] self-stretch flex items-center justify-center cursor-pointer ",
              {
                hidden:
                  !redelegateLoadingParams?.steps ||
                  redelegateLoadingParams.steps.length === 0,
              },
              showDetail ? "" : "bg-color-bgPage"
            )}
            onClick={() => setShowDetail(!showDetail)}
          >
            <div
              className={classNames(
                "text-[.16rem] font-[600]",
                "text-color-text1"
              )}
            >
              Detail
            </div>
            <div
              className={classNames(
                "ml-[.1rem]",
                showDetail ? "-rotate-180" : ""
              )}
            >
              <Icomoon
                icon="arrow-down"
                size="0.14rem"
                color={darkMode ? "#E8EFFD" : "#222C3C"}
              />
            </div>
          </div>

          {showDetail &&
            redelegateLoadingParams?.steps &&
            redelegateLoadingParams.steps.length > 0 && (
              <div
                className="self-stretch bg-color-bgPage grid rounded-b-[.16rem] pt-[.16rem]"
                style={{
                  gridTemplateColumns: "50% 50%",
                }}
              >
                {/* TokenizeShares progress */}
                {redelegateLoadingParams?.steps &&
                  redelegateLoadingParams?.steps.includes("tokenizeShares") && (
                    <RedelegateLoadingProgressItem
                      name="TokenizeShares"
                      chainId={redelegateLoadingParams?.chainId}
                      stepIndex={redelegateLoadingParams?.steps.indexOf(
                        "tokenizeShares"
                      )}
                      data={
                        redelegateLoadingParams?.progressDetail?.tokenizeShares
                      }
                      txHash={redelegateLoadingParams?.prepareTxHash}
                      scanUrl={redelegateLoadingParams?.scanUrl}
                    />
                  )}

                {/* Sending progress */}
                {redelegateLoadingParams?.steps &&
                  redelegateLoadingParams?.steps.includes("sending") && (
                    <RedelegateLoadingProgressItem
                      name="Sending"
                      chainId={redelegateLoadingParams?.chainId}
                      stepIndex={redelegateLoadingParams?.steps.indexOf(
                        "sending"
                      )}
                      data={redelegateLoadingParams?.progressDetail?.sending}
                      txHash={redelegateLoadingParams?.transferTxHash}
                      scanUrl={redelegateLoadingParams?.scanUrl}
                    />
                  )}

                {/* Minting progress */}
                {redelegateLoadingParams?.steps &&
                  redelegateLoadingParams?.steps.includes("minting") && (
                    <RedelegateLoadingProgressItem
                      name="Minting"
                      stepIndex={redelegateLoadingParams?.steps.indexOf(
                        "minting"
                      )}
                      chainId={redelegateLoadingParams?.chainId}
                      data={redelegateLoadingParams?.progressDetail?.minting}
                    />
                  )}
              </div>
            )}
        </div>
      </Box>
    </Modal>
  );
};
