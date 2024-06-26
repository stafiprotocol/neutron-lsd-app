import classNames from "classnames";
import { BubblesLoading } from "components/common/BubblesLoading";
import { Icomoon } from "components/icon/Icomoon";
import { lsdTokenChainConfig, neutronChainConfig } from "config/chain";
import { DEFAULT_MIN_STAKE_AMOUNT, DEFAULT_STAKE_FEE } from "constants/common";
import { useAppDispatch, useAppSelector } from "hooks/common";
import { useAppSlice } from "hooks/selector";
import { useApr } from "hooks/useApr";
import { useBalance } from "hooks/useBalance";
import { useCosmosChainAccount } from "hooks/useCosmosChainAccount";
import { useLsdTokenRate } from "hooks/useLsdTokenRate";
import { usePrice } from "hooks/usePrice";
import { ChainConfig } from "interfaces/common";
import { bindPopover } from "material-ui-popup-state";
import HoverPopover from "material-ui-popup-state/HoverPopover";
import { bindHover, usePopupState } from "material-ui-popup-state/hooks";
import Image from "next/image";
import { useMemo, useState } from "react";
import { handleTokenStake } from "redux/reducers/TokenSlice";
import { connectKeplrAccount } from "redux/reducers/WalletSlice";
import { RootState } from "redux/store";
import { isEmptyValue } from "utils/commonUtils";
import { getLsdTokenName, getTokenName } from "utils/configUtils";
import { getTokenIcon } from "utils/iconUtils";
import { formatLargeAmount, formatNumber } from "utils/numberUtils";
import { CustomButton } from "../common/CustomButton";
import { CustomNumberInput } from "../common/CustomNumberInput";
import { DataLoading } from "../common/DataLoading";

export const LsdTokenStake = () => {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSlice();
  const lsdTokenRate = useLsdTokenRate();

  const { lsdBalance } = useBalance();
  const { apr } = useApr();
  const { tokenPrice, gasPrice } = usePrice();

  const [stakeAmount, setStakeAmount] = useState("");
  const neutronAccount = useCosmosChainAccount(neutronChainConfig.chainId);
  const lsdTokenAccount = useCosmosChainAccount(lsdTokenChainConfig.chainId);

  const { balance } = useBalance();

  const availableBalance = useMemo(() => {
    if (!balance || isNaN(Number(balance))) {
      return "--";
    }
    const reserveAmount = lsdTokenChainConfig.stakeReserveAmount || 0.05;
    return (
      Math.max(0, Number(balance) - reserveAmount - DEFAULT_STAKE_FEE) + ""
    );
  }, [balance]);

  const { stakeLoading } = useAppSelector((state: RootState) => {
    return {
      stakeLoading: state.app.stakeLoading,
    };
  });

  const walletNotConnected = useMemo(() => {
    return !neutronAccount || !lsdTokenAccount;
  }, [neutronAccount, lsdTokenAccount]);

  const stakeValue = useMemo(() => {
    if (
      !stakeAmount ||
      isNaN(Number(stakeAmount)) ||
      Number(stakeAmount) === 0 ||
      isNaN(Number(tokenPrice))
    ) {
      return undefined;
    }
    return Number(stakeAmount) * Number(tokenPrice);
  }, [stakeAmount, tokenPrice]);

  const willReceiveAmount = useMemo(() => {
    if (
      isNaN(Number(stakeAmount)) ||
      isNaN(Number(lsdTokenRate)) ||
      Number(stakeAmount) === 0
    ) {
      return "--";
    }
    return Number(stakeAmount) / Number(lsdTokenRate) + "";
  }, [stakeAmount, lsdTokenRate]);

  const estimateFee = useMemo(() => {
    return DEFAULT_STAKE_FEE;
  }, []);

  const transactionCost = useMemo(() => {
    if (isNaN(Number(estimateFee))) {
      return "--";
    }
    return Number(estimateFee) + "";
  }, [estimateFee]);

  const transactionCostValue = useMemo(() => {
    if (isNaN(Number(transactionCost)) || isNaN(Number(tokenPrice))) {
      return "--";
    }
    return Number(transactionCost) * Number(tokenPrice) + "";
  }, [transactionCost, tokenPrice]);

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
      !stakeAmount ||
      isNaN(Number(stakeAmount)) ||
      Number(stakeAmount) === 0 ||
      isNaN(Number(availableBalance))
    ) {
      return [true, "Stake"];
    }

    if (Number(stakeAmount) < DEFAULT_MIN_STAKE_AMOUNT) {
      return [
        true,
        `Minimal Stake Amount is ${DEFAULT_MIN_STAKE_AMOUNT} ${getTokenName()}`,
      ];
    }

    if (Number(stakeAmount) > Number(availableBalance)) {
      return [true, `Not Enough ${getTokenName()} to Stake`];
    }

    return [false, "Stake"];
  }, [
    availableBalance,
    stakeAmount,
    walletNotConnected,
    neutronAccount,
    lsdTokenAccount,
  ]);

  const newRTokenBalance = useMemo(() => {
    if (isNaN(Number(lsdBalance))) {
      return "--";
    }

    if (isNaN(Number(stakeAmount)) || isNaN(Number(lsdTokenRate))) {
      return "--";
    }
    return Number(lsdBalance) + Number(stakeAmount) / Number(lsdTokenRate) + "";
  }, [lsdBalance, lsdTokenRate, stakeAmount]);

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
    let amount = Number(availableBalance);

    if (Number(amount) > 0) {
      setStakeAmount(
        formatNumber(amount.toString(), {
          toReadable: false,
          withSplit: false,
        })
      );
    }
  };

  const clickStake = () => {
    // Connect Wallet
    if (walletNotConnected) {
      clickConnectWallet();
      return;
    }

    dispatch(
      handleTokenStake(
        Number(stakeAmount) + "",
        willReceiveAmount,
        false,
        (success) => {
          if (success) {
            setStakeAmount("");
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
      <div className="h-[1.07rem] mt-[.18rem] pt-[.24rem] mx-[.24rem] bg-color-bgPage rounded-[.3rem]">
        <div className="mx-[.12rem] flex items-start">
          <div className="h-[.42rem] bg-color-bg2 rounded-[.3rem] flex items-center cursor-pointer">
            <div className="ml-[.08rem] flex items-center">
              <div className="w-[.34rem] h-[.34rem] relative">
                <Image src={getTokenIcon()} alt="logo" layout="fill" />
              </div>

              <div className="text-color-text1 text-[.16rem] ml-[.16rem]">
                {getTokenName()}
              </div>
            </div>

            <div className="ml-[.16rem] mr-[.16rem]">
              {/* <Icomoon icon="arrow-down" size=".1rem" color="#848B97" /> */}
            </div>
          </div>

          <div className="flex-1 flex justify-start flex-col pl-[.14rem]">
            <div className="flex items-center h-[.42rem]">
              <CustomNumberInput
                value={stakeAmount}
                handleValueChange={setStakeAmount}
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
                {stakeValue
                  ? `$${formatNumber(stakeValue, { decimals: 2 })}`
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
        loading={stakeLoading}
        disabled={buttonDisabled}
        mt=".18rem"
        className="mx-[.24rem]"
        height=".56rem"
        type={isButtonSecondary ? "secondary" : "primary"}
        onClick={clickStake}
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
        className="mx-[.75rem] my-[.24rem] grid items-stretch font-[500]"
        style={{ gridTemplateColumns: "40% 30% 30%" }}
      >
        <div className="flex justify-start ml-[.18rem]">
          <div className="flex flex-col items-center">
            <div className="text-text2/50 dark:text-text2Dark/50 text-[.14rem]">
              Will Receive
            </div>
            <div className="mt-[.1rem] flex items-center cursor-pointer">
              <div
                className="text-color-text2 text-[.16rem]"
                {...bindHover(ratePopupState)}
              >
                {formatLargeAmount(willReceiveAmount)} {getLsdTokenName()}
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
                <DataLoading height=".16rem" />
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
              {getTokenName()}
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
              {getTokenName()}
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
