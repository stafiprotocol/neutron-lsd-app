import classNames from "classnames";
import { BubblesLoading } from "components/common/BubblesLoading";
import { Icomoon } from "components/icon/Icomoon";
import { lsdTokenChainConfig, neutronChainConfig } from "config/chain";
import { DEFAULT_UNSTAKE_FEE } from "constants/common";
import { useAppDispatch, useAppSelector } from "hooks/common";
import { useAppSlice } from "hooks/selector";
import { useApr } from "hooks/useApr";
import { useBalance } from "hooks/useBalance";
import { useCosmosChainAccount } from "hooks/useCosmosChainAccount";
import { useLsdTokenRate } from "hooks/useLsdTokenRate";
import { usePrice } from "hooks/usePrice";
import { ChainConfig } from "interfaces/common";
import { bindHover, bindPopover } from "material-ui-popup-state";
import HoverPopover from "material-ui-popup-state/HoverPopover";
import { usePopupState } from "material-ui-popup-state/hooks";
import Image from "next/image";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { updateLsdTokenBalance } from "redux/reducers/LsdTokenSlice";
import { handleLsdTokenUnstake } from "redux/reducers/TokenSlice";
import { connectKeplrAccount } from "redux/reducers/WalletSlice";
import { RootState } from "redux/store";
import { isEmptyValue } from "utils/commonUtils";
import { getLsdTokenName, getTokenName } from "utils/configUtils";
import { getLsdTokenIcon } from "utils/iconUtils";
import { getUnstakeDaysLeft } from "utils/lsdTokenUtils";
import { formatLargeAmount, formatNumber } from "utils/numberUtils";
import { CustomButton } from "../common/CustomButton";
import { CustomNumberInput } from "../common/CustomNumberInput";
import { DataLoading } from "../common/DataLoading";

export const LsdTokenUnstake = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSlice();

  const neutronAccount = useCosmosChainAccount(neutronChainConfig.chainId);
  const lsdTokenAccount = useCosmosChainAccount(lsdTokenChainConfig.chainId);
  const lsdTokenRate = useLsdTokenRate();

  const { lsdBalance, balance } = useBalance();

  const { apr } = useApr();
  const { ntrnPrice, tokenPrice } = usePrice();

  const [unstakeAmount, setUnstakeAmount] = useState("");

  const { unstakeLoading, unbondingDuration } = useAppSelector(
    (state: RootState) => {
      return {
        unstakeLoading: state.app.unstakeLoading,
        unbondingDuration: state.lsdToken.unbondingDuration,
      };
    }
  );

  const walletNotConnected = useMemo(() => {
    return !neutronAccount || !lsdTokenAccount;
  }, [neutronAccount, lsdTokenAccount]);

  const availableBalance = useMemo(() => {
    if (walletNotConnected) {
      return "--";
    }
    return lsdBalance;
  }, [lsdBalance, walletNotConnected]);

  const unstakeValue = useMemo(() => {
    if (
      !unstakeAmount ||
      isNaN(Number(unstakeAmount)) ||
      Number(unstakeAmount) === 0 ||
      isNaN(Number(tokenPrice)) ||
      isNaN(Number(lsdTokenRate))
    ) {
      return undefined;
    }
    return Number(unstakeAmount) * Number(tokenPrice) * Number(lsdTokenRate);
  }, [unstakeAmount, tokenPrice, lsdTokenRate]);

  const estimateFee = useMemo(() => {
    return DEFAULT_UNSTAKE_FEE;
  }, []);

  const transactionCost = useMemo(() => {
    if (isNaN(Number(estimateFee))) {
      return "--";
    }
    return Number(estimateFee) + "";
  }, [estimateFee]);

  const transactionCostValue = useMemo(() => {
    if (isNaN(Number(transactionCost)) || isNaN(Number(ntrnPrice))) {
      return "--";
    }
    return Number(transactionCost) * Number(ntrnPrice) + "";
  }, [transactionCost, ntrnPrice]);

  const redeemFee = useMemo(() => {
    return "0";
  }, []);

  const willReceiveAmount = useMemo(() => {
    if (
      isNaN(Number(unstakeAmount)) ||
      isNaN(Number(lsdTokenRate)) ||
      Number(unstakeAmount) === 0
    ) {
      return "--";
    }
    return (
      Number(unstakeAmount) * Number(lsdTokenRate) - Number(redeemFee) + ""
    );
  }, [unstakeAmount, lsdTokenRate, redeemFee]);

  const [buttonDisabled, buttonText, isButtonSecondary] = useMemo(() => {
    if (walletNotConnected) {
      const text =
        !neutronAccount && !lsdTokenAccount
          ? "Connect Wallet"
          : !neutronAccount
          ? `Connect ${neutronChainConfig.chainName}`
          : `Connect ${lsdTokenChainConfig.chainName}`;
      return [false, text, true];
    }

    if (
      !unstakeAmount ||
      isNaN(Number(unstakeAmount)) ||
      Number(unstakeAmount) === 0 ||
      isNaN(Number(availableBalance))
    ) {
      return [true, "Unstake"];
    }

    if (Number(unstakeAmount) > Number(availableBalance)) {
      return [true, `Not Enough ${getLsdTokenName()} to Unstake`];
    }

    if (
      (isNaN(Number(estimateFee)) ? 0 : Number(estimateFee) * 1.4) >
      Number(balance)
    ) {
      return [true, `Not Enough ${getTokenName()} for Fee`];
    }

    return [false, "Unstake"];
  }, [
    availableBalance,
    unstakeAmount,
    walletNotConnected,
    estimateFee,
    balance,
    neutronAccount,
    lsdTokenAccount,
  ]);

  const resetState = () => {
    setUnstakeAmount("");
  };

  const clickConnectWallet = async () => {
    const connectChainConfigs: ChainConfig[] = [];
    if (!neutronAccount) {
      connectChainConfigs.push(neutronChainConfig);
    }
    if (!lsdTokenAccount) {
      connectChainConfigs.push(lsdTokenChainConfig);
    }
    dispatch(connectKeplrAccount(connectChainConfigs));
  };

  const clickMax = () => {
    if (walletNotConnected || isNaN(Number(availableBalance))) {
      return;
    }
    setUnstakeAmount(
      formatNumber(availableBalance, {
        toReadable: false,
        withSplit: false,
      })
    );
  };

  const jumpToWithdraw = () => {
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        tab: "withdraw",
      },
    });
  };

  const clickUnstake = () => {
    // Connect Wallet
    if (walletNotConnected) {
      clickConnectWallet();
      return;
    }

    dispatch(
      handleLsdTokenUnstake(
        unstakeAmount,
        lsdTokenAccount?.bech32Address,
        willReceiveAmount,
        false,
        (success) => {
          dispatch(updateLsdTokenBalance());
          if (success) {
            resetState();
          }
        }
      )
    );
  };

  const ratePopupState = usePopupState({
    variant: "popover",
    popupId: "rate",
  });

  const txFeePopupState = usePopupState({
    variant: "popover",
    popupId: "txFee",
  });

  return (
    <div>
      <div
        className="h-[.56rem] mt-[.18rem] mx-[.24rem] bg-[#6C86AD14] dark:bg-[#6C86AD50] rounded-[.16rem] flex items-center justify-between pl-[.12rem] pr-[.18rem]"
        onClick={() => {
          // openLink(getUnstakeTipLink());
        }}
      >
        <div className="flex items-center">
          <Icomoon icon="tip" size=".2rem" />

          <div className="ml-[.06rem] text-color-text2 text-[.14rem]">
            Unstaking may take around{" "}
            <span className="text-color-text1">
              {getUnstakeDaysLeft(unbondingDuration)}
            </span>
            . After that, withdraw function will open
          </div>
        </div>

        {/* <Icomoon icon="right" color="#6C86AD" size=".11rem" /> */}
      </div>

      <div className="h-[1.07rem] mt-[.18rem] pt-[.24rem] mx-[.24rem] bg-color-bgPage rounded-[.3rem]">
        <div className="mx-[.12rem] flex items-start">
          <div className="h-[.42rem] bg-color-bg2 rounded-[.3rem] flex items-center cursor-pointer">
            <div className="ml-[.08rem] flex items-center">
              <div className="w-[.34rem] h-[.34rem] relative">
                <Image src={getLsdTokenIcon()} alt="logo" layout="fill" />
              </div>

              <div className="text-color-text1 text-[.16rem] ml-[.16rem]">
                {getLsdTokenName()}
              </div>
            </div>

            <div className="ml-[.16rem] mr-[.16rem]">
              {/* <Icomoon icon="arrow-down" size=".1rem" color="#848B97" /> */}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-start pl-[.14rem]">
            <div className="flex items-center h-[.42rem]">
              <CustomNumberInput
                value={unstakeAmount}
                handleValueChange={setUnstakeAmount}
                fontSize=".24rem"
                placeholder="Amount"
              />
              <div>
                <CustomButton
                  type="stroke"
                  width=".63rem"
                  height=".36rem"
                  fontSize=".16rem"
                  className="bg-color-bg1 border-color-border1"
                  onClick={clickMax}
                  border={`0.01rem solid ${darkMode ? "#6C86AD80" : "#ffffff"}`}
                >
                  Max
                </CustomButton>
              </div>
            </div>

            <div className="mt-[.1rem] flex items-center justify-between text-[.14rem]">
              <div className="text-color-text2">
                {unstakeValue
                  ? `$${formatNumber(unstakeValue, { decimals: 2 })}`
                  : ""}{" "}
              </div>

              <div className="flex items-center">
                <div className="text-color-text2">Balance</div>
                <div className="ml-[.06rem] text-color-text1">
                  {formatNumber(availableBalance)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CustomButton
        loading={unstakeLoading}
        disabled={buttonDisabled}
        mt=".18rem"
        className="mx-[.24rem]"
        height=".56rem"
        onClick={clickUnstake}
        type={isButtonSecondary ? "secondary" : "primary"}
        border="none"
      >
        <div className="flex items-center">
          {buttonText}

          {(buttonText.indexOf("Wrong network") >= 0 ||
            buttonText.indexOf("Insufficient FIS.") >= 0) && (
            <div className="ml-[.12rem] flex items-center">
              <Icomoon icon="arrow-right" size=".12rem" color="#222C3C" />
            </div>
          )}
        </div>
      </CustomButton>

      <div
        className="mt-[.24rem] grid items-stretch font-[500] mx-[.75rem]"
        style={{ gridTemplateColumns: "40% 30% 30%" }}
      >
        <div className="flex justify-start ml-[.18rem]">
          <div className="flex flex-col items-center">
            <div className="text-text2/50 dark:text-text2Dark/50 text-[.14rem]">
              Will Receive
            </div>
            <div
              className="mt-[.1rem] flex items-center cursor-pointer"
              {...bindHover(ratePopupState)}
            >
              <div className="text-color-text2 text-[.16rem]">
                {formatLargeAmount(willReceiveAmount)} {getTokenName()}
              </div>
              <div
                className={classNames(
                  "ml-[.06rem] flex items-center relative self-center",
                  ratePopupState.isOpen ? "rotate-[270deg]" : "rotate-90"
                )}
              >
                <Icomoon
                  icon="right"
                  size=".12rem"
                  color="#6C86AD"
                  layout="fill"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-text2/50 dark:text-text2Dark/50 text-[.14rem]">
            APR
          </div>

          <div className="mt-[.1rem] flex items-center">
            {apr !== undefined ? (
              <div className="text-color-text2 text-[.16rem]">
                {formatNumber(apr, { decimals: 2, toReadable: false })}%
              </div>
            ) : (
              <div className="">
                <DataLoading height=".32rem" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mr-[.0rem]">
          <div className="flex flex-col items-center">
            <div className="text-text2/50 dark:text-text2Dark/50 text-[.14rem]">
              Est. Cost
            </div>

            <div className="mt-[.1rem] flex items-center cursor-pointer">
              <div
                className="text-color-text2 text-[.16rem]"
                {...bindHover(txFeePopupState)}
              >
                ${formatNumber(transactionCostValue, { decimals: 2 })}
              </div>
              <div
                className={classNames(
                  "ml-[.06rem] flex items-center relative self-center",
                  txFeePopupState.isOpen ? "rotate-[270deg]" : "rotate-90"
                )}
              >
                <Icomoon
                  icon="right"
                  size=".12rem"
                  color="#6C86AD"
                  layout="fill"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <HoverPopover
        {...bindPopover(ratePopupState)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
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
      >
        <div
          className={classNames(
            "p-[.16rem] text-[.14rem] text-color-text2 flex flex-col justify-center",
            darkMode ? "dark" : ""
          )}
        >
          <div className="text-center leading-[150%]">Exchange Rate</div>
          <div className="text-center mt-[.08rem] leading-[150%]">
            1:{formatNumber(lsdTokenRate, { decimals: 6 })}
          </div>
        </div>
      </HoverPopover>

      <HoverPopover
        {...bindPopover(txFeePopupState)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
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
      >
        <div
          className={classNames(
            "text-color-text2 w-[2.5rem] p-[.16rem] text-[.14rem]",
            darkMode ? "dark" : ""
          )}
        >
          <div className="flex justify-between my-[.16rem]">
            <div>Tx Fee</div>
            <div>
              {isEmptyValue(estimateFee) ? (
                <BubblesLoading />
              ) : (
                formatNumber(estimateFee, { decimals: 4 })
              )}{" "}
              NTRN
            </div>
          </div>
          <div className="h-[1px] bg-color-popoverDivider my-[.1rem]" />
          <div className="text-color-text1 flex items-start justify-between mt-[.16rem]">
            <div>Overall Tx Fee</div>
            <div className="flex items-center">
              {isEmptyValue(transactionCost) ? (
                <BubblesLoading />
              ) : (
                formatNumber(transactionCost, { decimals: 4 })
              )}{" "}
              NTRN
            </div>
          </div>
          <div className="mt-[.16rem] text-right flex items-center justify-end mb-[.16rem]">
            ~$
            {isEmptyValue(transactionCostValue) ? (
              <BubblesLoading />
            ) : (
              formatNumber(transactionCostValue, { decimals: 4 })
            )}
          </div>
        </div>
      </HoverPopover>
    </div>
  );
};
