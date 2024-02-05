import { Popover, Skeleton } from "@mui/material";
import { queryStakingValidator } from "@stafihub/apps-wallet";
import classNames from "classnames";
import { EmptyContent } from "components/common/EmptyContent";
import { MyTooltip } from "components/common/MyTooltip";
import { Icomoon } from "components/icon/Icomoon";
import { lsdTokenChainConfig, neutronChainConfig } from "config/chain";
import { DEFAULT_STAKE_FEE } from "constants/common";
import { useAppDispatch, useAppSelector } from "hooks/common";
import { useAppSlice } from "hooks/selector";
import { useApr } from "hooks/useApr";
import { useBalance } from "hooks/useBalance";
import { useCosmosChainAccount } from "hooks/useCosmosChainAccount";
import { useDebouncedEffect } from "hooks/useDebouncedEffect";
import { useDelegateTokenAmount } from "hooks/useDelegateTokenAmount";
import { useLsdTokenRate } from "hooks/useLsdTokenRate";
import { useLsmBalance } from "hooks/useLsmBalance";
import { useLsmValidator } from "hooks/useLsmValidator";
import { useMinimalStake } from "hooks/useMinimalStake";
import { usePrice } from "hooks/usePrice";
import { useStakingLimit } from "hooks/useStakingLimit";
import { ChainConfig, LsmBalanceItem, LsmSendItem } from "interfaces/common";
import _ from "lodash";
import { bindPopover } from "material-ui-popup-state";
import { bindTrigger, usePopupState } from "material-ui-popup-state/hooks";
import Image from "next/image";
import { useRouter } from "next/router";
import defaultAvatar from "public/images/default_avatar.png";
import { useMemo, useState } from "react";
import {
  redelegateLsmToken,
  redelegateStakedToken,
} from "redux/reducers/RedelegateSlice";
import { connectKeplrAccount } from "redux/reducers/WalletSlice";
import { RootState } from "redux/store";
import { openLink } from "utils/commonUtils";
import { getLsdTokenName, getTokenName } from "utils/configUtils";
import { getTokenIcon } from "utils/iconUtils";
import {
  amountToChain,
  chainAmountToHuman,
  formatLargeAmount,
  formatNumber,
} from "utils/numberUtils";
import snackbarUtil from "utils/snackbarUtils";
import { CustomButton } from "../common/CustomButton";
import { CustomNumberInput } from "../common/CustomNumberInput";
import { DataLoading } from "../common/DataLoading";

export const LsdTokenRedelegate = (props: {}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSlice();
  const lsdTokenRate = useLsdTokenRate();
  const { lsdBalance } = useBalance();
  const { tokenPrice } = usePrice();

  const { apr } = useApr();
  const [stakeAmount, setStakeAmount] = useState("");
  const minimalStake = useMinimalStake();

  const [selectedToken, setSelectedToken] = useState<
    "Staked ATOM" | "LSM ATOM"
  >("Staked ATOM");

  const { stakeLoading } = useAppSelector((state: RootState) => {
    return {
      stakeLoading: state.app.stakeLoading,
    };
  });

  const tokenListPopupState = usePopupState({
    variant: "popover",
    popupId: "tokenList",
  });

  const supportTokenList: ("Staked ATOM" | "LSM ATOM")[] = useMemo(() => {
    return ["Staked ATOM", "LSM ATOM"];
  }, []);

  const { delegateTokenBalance } = useDelegateTokenAmount();
  const { exceedLimit, liquidStakingCap } = useStakingLimit();

  const { lsmBalances } = useLsmBalance();

  const neutronKeplrAccount = useCosmosChainAccount(neutronChainConfig.chainId);
  const lsdTokenKeplrAccount = useCosmosChainAccount(
    lsdTokenChainConfig.chainId
  );

  const [lsmBalanceSelectedStore, setLsmBalanceSelectedStore] = useState<{
    [id in string]?: boolean;
  }>({});
  const [lsmBalanceInEditStore, setLsmBalanceInEditStore] = useState<{
    [id in string]?: boolean;
  }>({});
  const [lsmBalanceInputAmountStore, setLsmBalanceInputAmountStore] = useState<{
    [id in string]?: string;
  }>({});

  const balance = useMemo(() => {
    return delegateTokenBalance;
  }, [delegateTokenBalance]);

  const lsmBalance = useMemo(() => {
    let balance = 0;
    lsmBalances.forEach((item) => {
      balance += Number(chainAmountToHuman(item.balance.amount));
    });
    return balance + "";
  }, [lsmBalances]);

  const walletNotConnected = useMemo(() => {
    return !lsdTokenKeplrAccount || !neutronKeplrAccount;
  }, [lsdTokenKeplrAccount, neutronKeplrAccount]);

  const lsmStakeAmount = useMemo(() => {
    let amount = 0;
    _.keys(lsmBalanceSelectedStore)
      .filter((key) => lsmBalanceSelectedStore[key])
      .forEach((key) => {
        const lsmBalance = lsmBalances.find((item) => item.recordId === key);
        const inputAmount = lsmBalanceInputAmountStore[key];
        const inEdit = lsmBalanceInEditStore[key];
        const currentAmount = !inEdit
          ? chainAmountToHuman(lsmBalance?.balance.amount)
          : inputAmount;

        // console.log("11", humanToAtomic(currentAmount));
        amount = amount + Number(amountToChain(currentAmount));

        // amount = floadAdd(amount, Number(currentAmount)).toNumber();
        // amount += Number(currentAmount);
        // console.log({ lsmBalance });
        // console.log({ inputAmount });
        // console.log({ inEdit });
        // console.log({ currentAmount });
      });

    // console.log(Math.pow(10, 6));
    // console.log("xxx", Math.floor(multiply(Number(0.50001), Math.pow(10, 6))));

    return (
      formatNumber(chainAmountToHuman(amount), {
        toReadable: false,
        withSplit: false,
        fixedDecimals: false,
        roundMode: "round",
      }) + ""
    );
  }, [
    lsmBalanceSelectedStore,
    lsmBalances,
    lsmBalanceInputAmountStore,
    lsmBalanceInEditStore,
  ]);

  const stakeValue = useMemo(() => {
    const amount =
      selectedToken === "Staked ATOM" ? stakeAmount : lsmStakeAmount;
    if (
      !amount ||
      isNaN(Number(amount)) ||
      Number(amount) === 0 ||
      isNaN(Number(tokenPrice))
    ) {
      return undefined;
    }
    return Number(amount) * Number(tokenPrice);
  }, [stakeAmount, lsmStakeAmount, selectedToken, tokenPrice]);

  const { noValidValidator, selectedValidatorAddr, validValidators } =
    useLsmValidator(
      selectedToken === "Staked ATOM" ? stakeAmount : lsmStakeAmount
    );

  const willReceiveAmount = useMemo(() => {
    const amount =
      selectedToken === "Staked ATOM" ? stakeAmount : lsmStakeAmount;
    if (
      isNaN(Number(amount)) ||
      isNaN(Number(lsdTokenRate)) ||
      Number(amount) === 0
    ) {
      return "--";
    }
    return Number(amount) / Number(lsdTokenRate) + "";
  }, [stakeAmount, lsdTokenRate, selectedToken, lsmStakeAmount]);

  const transactionCost = useMemo(() => {
    return DEFAULT_STAKE_FEE;
  }, []);

  const transactionCostValue = useMemo(() => {
    {
      if (isNaN(Number(transactionCost)) || isNaN(Number(tokenPrice))) {
        return "--";
      }
      return Number(transactionCost) * Number(tokenPrice) + "";
    }
  }, [transactionCost, tokenPrice]);

  const [buttonDisabled, buttonText, isButtonSecondary] = useMemo(() => {
    if (exceedLimit) {
      return [true, "Liquid stake", false];
    }

    if (walletNotConnected) {
      if (!neutronKeplrAccount && !lsdTokenKeplrAccount) {
        return [false, "Connect Wallet", true];
      } else if (!lsdTokenKeplrAccount) {
        return [false, `Connect ${lsdTokenChainConfig.chainName}`, true];
      } else {
        return [false, `Connect ${neutronChainConfig.chainName}`, true];
      }
    }
    if (
      !stakeAmount ||
      isNaN(Number(stakeAmount)) ||
      Number(stakeAmount) === 0 ||
      isNaN(Number(balance))
    ) {
      return [true, "Liquid stake", false];
    }

    if (Number(stakeAmount) > Number(balance)) {
      return [true, `Not Enough balance`];
    }

    if (Number(stakeAmount) < Number(minimalStake)) {
      return [
        true,
        `Minimal Liquid stake Amount is ${minimalStake} ${getTokenName()}`,
        false,
      ];
    }

    return [
      false,
      `Liquid stake ${formatNumber(stakeAmount, {
        fixedDecimals: false,
      })} Staked ${getTokenName()}`,
      false,
    ];
  }, [
    exceedLimit,
    balance,
    stakeAmount,
    walletNotConnected,
    neutronKeplrAccount,
    minimalStake,
    lsdTokenKeplrAccount,
  ]);

  const lsmNeedInputRecordId = useMemo(() => {
    let recordId: string | undefined = undefined;
    _.keys(lsmBalanceSelectedStore)
      .filter((key) => lsmBalanceSelectedStore[key])
      .forEach((key) => {
        const inputAmount = lsmBalanceInputAmountStore[key];
        const inEdit = lsmBalanceInEditStore[key];

        if (
          !recordId &&
          inEdit &&
          (!inputAmount || Number(inputAmount) === 0)
        ) {
          recordId = key;
        }
      });

    return recordId;
  }, [
    lsmBalanceSelectedStore,
    lsmBalanceInputAmountStore,
    lsmBalanceInEditStore,
  ]);

  const lsmInputExceedRecordId = useMemo(() => {
    let recordId: string | undefined = undefined;
    _.keys(lsmBalanceSelectedStore)
      .filter((key) => lsmBalanceSelectedStore[key])
      .forEach((key) => {
        const lsmBalance = lsmBalances.find((item) => item.recordId === key);
        const inputAmount = lsmBalanceInputAmountStore[key];
        const inEdit = lsmBalanceInEditStore[key];
        const currentAmount = !inEdit
          ? chainAmountToHuman(lsmBalance?.balance.amount)
          : inputAmount;

        if (
          !recordId &&
          Number(currentAmount) >
            Number(chainAmountToHuman(lsmBalance?.balance.amount))
        ) {
          recordId = lsmBalance?.recordId;
        }
      });

    return recordId;
  }, [
    lsmBalanceSelectedStore,
    lsmBalances,
    lsmBalanceInputAmountStore,
    lsmBalanceInEditStore,
  ]);

  const [lsmButtonDisabled, lsmBbuttonText, lsmButtonSecondary] =
    useMemo(() => {
      if (exceedLimit) {
        return [true, "Liquid stake", false];
      }

      if (walletNotConnected) {
        if (!neutronKeplrAccount && !lsdTokenKeplrAccount) {
          return [false, "Connect Wallet first", true];
        } else if (!lsdTokenKeplrAccount) {
          return [false, `Connect ${lsdTokenChainConfig.chainName}`, true];
        } else {
          return [false, `Connect ${neutronChainConfig.chainName}`, true];
        }
      }

      if (
        !lsmStakeAmount ||
        isNaN(Number(lsmStakeAmount)) ||
        Number(lsmStakeAmount) === 0
      ) {
        return [true, "Liquid stake", false];
      }

      if (lsmInputExceedRecordId) {
        return [true, `Not Enough balance for liquid staking`];
        // return [true, `Not Enough balance for record: ${lsmInputExceedRecordId}`];
      }

      if (lsmNeedInputRecordId) {
        return [true, `Please input amount for liquid staking`];
        // return [true, `Please input amount for record: ${lsmNeedInputRecordId}`];
      }

      if (Number(lsmStakeAmount) < Number(minimalStake)) {
        return [
          true,
          `Minimal Liquid stake Amount is ${minimalStake} ${getTokenName()}`,
          false,
        ];
      }

      return [
        false,
        `Liquid stake ${lsmStakeAmount} LSM ${getTokenName()}`,
        false,
      ];
    }, [
      exceedLimit,
      walletNotConnected,
      neutronKeplrAccount,
      lsmInputExceedRecordId,
      lsmStakeAmount,
      lsmNeedInputRecordId,
      minimalStake,
      lsdTokenKeplrAccount,
    ]);

  const newRTokenBalance = useMemo(() => {
    if (isNaN(Number(lsdBalance))) {
      return "--";
    }

    const amount =
      selectedToken === "Staked ATOM" ? stakeAmount : lsmStakeAmount;

    if (isNaN(Number(amount)) || isNaN(Number(lsdTokenRate))) {
      return "--";
    }
    // console.log("xxx", rTokenBalance, stakeAmount, rTokenRatio);
    return Number(lsdBalance) + Number(amount) / Number(lsdTokenRate) + "";
  }, [stakeAmount, selectedToken, lsmStakeAmount, lsdBalance, lsdTokenRate]);

  const clickConnectWallet = () => {
    const connectChainConfigs: ChainConfig[] = [];
    if (!neutronKeplrAccount) {
      connectChainConfigs.push(neutronChainConfig);
    }
    if (!lsdTokenKeplrAccount) {
      connectChainConfigs.push(lsdTokenChainConfig);
    }
    dispatch(connectKeplrAccount(connectChainConfigs));
  };

  const resetState = () => {
    setStakeAmount("");
    setLsmBalanceSelectedStore({});
    setLsmBalanceInEditStore({});
    setLsmBalanceInputAmountStore;
  };

  const clickMax = () => {
    if (walletNotConnected || isNaN(Number(balance))) {
      return;
    }
    let amount = Number(balance);

    if (Number(amount) > 0) {
      setStakeAmount(
        formatNumber(amount.toString(), {
          toReadable: false,
          withSplit: false,
          fixedDecimals: false,
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

    if (noValidValidator || !selectedValidatorAddr) {
      snackbarUtil.error(
        "Liquid stake disabled: validator self-bond cap reached"
      );
      return;
    }

    confirmStakeStafiHubToken();
  };

  const clickLsmStake = () => {
    // Connect Wallet
    if (walletNotConnected) {
      tokenListPopupState.close();
      clickConnectWallet();
      return;
    }

    if (noValidValidator || !selectedValidatorAddr) {
      snackbarUtil.error(
        "Liquid stake disabled: validator self-bond cap reached"
      );
      return;
    }

    confirmStakeStafiHubLsmToken();
  };

  const confirmStakeStafiHubToken = () => {
    dispatch(
      redelegateStakedToken(
        validValidators,
        selectedValidatorAddr || "",
        stakeAmount,
        willReceiveAmount,
        newRTokenBalance,
        () => {
          resetState();
        }
      )
    );
  };

  const confirmStakeStafiHubLsmToken = () => {
    tokenListPopupState.close();
    const sendItems: LsmSendItem[] = [];

    _.keys(lsmBalanceSelectedStore)
      .filter((key) => lsmBalanceSelectedStore[key])
      .forEach((key) => {
        const lsmBalance = lsmBalances.find((item) => item.recordId === key);
        const inputAmount = lsmBalanceInputAmountStore[key];
        const inEdit = lsmBalanceInEditStore[key];

        if (lsmBalance) {
          const currentAmount = !inEdit
            ? chainAmountToHuman(lsmBalance.balance.amount)
            : inputAmount;

          if (Number(currentAmount) > 0) {
            sendItems.push({
              recordId: key,
              validator: lsmBalance.validatorAddr || "",
              amount: currentAmount || "0",
            });
          }
        }
      });

    dispatch(
      redelegateLsmToken(
        selectedValidatorAddr || "",
        sendItems,
        lsmStakeAmount,
        willReceiveAmount,
        newRTokenBalance,
        false,
        (success) => {
          if (success) {
            resetState();
          }
        }
      )
    );
  };

  return (
    <div>
      {exceedLimit && (
        <div
          className="cursor-pointer h-[.56rem] mx-[.24rem] bg-[#6C86AD14] dark:bg-[#6C86AD50] rounded-[.16rem] flex items-center justify-between pl-[.12rem] pr-[.18rem]"
          onClick={() => {
            openLink(
              "https://dao.stafi.io/t/sip-8-stafi-lsm-integration-proposal/116"
            );
          }}
        >
          <div className="flex items-center">
            <Icomoon icon="tip" size=".2rem" />

            <div className="ml-[.06rem] text-color-text2 text-[.14rem] leading-normal">
              Liquid Stake is currently disabled because LSM has reached its{" "}
              {formatNumber(Number(liquidStakingCap) * 100, { decimals: 0 })}%
              cap
            </div>
          </div>

          <Icomoon icon="right" color="#6C86AD" size=".11rem" />
        </div>
      )}

      <div className=" h-[1.08rem] mt-[.18rem] pt-[.24rem] mx-[.24rem] bg-color-bgPage rounded-[.3rem]">
        <div className="mx-[.12rem] flex items-start">
          <div
            className="w-[1.8rem] h-[.42rem] bg-color-bg2 rounded-[.3rem] flex items-center space justify-between cursor-pointer"
            {...bindTrigger(tokenListPopupState)}
          >
            <div className="ml-[.08rem] flex items-center">
              <div className="w-[.34rem] h-[.34rem] relative">
                <Image src={getTokenIcon()} alt="logo" layout="fill" />
              </div>

              <div className="text-color-text1 text-[.16rem] ml-[.06rem]">
                {selectedToken}
              </div>
            </div>

            <div className="mr-[.12rem]">
              <Icomoon icon="arrow-down" size=".1rem" color="#848B97" />
            </div>
          </div>

          <div className="flex-1 flex justify-start flex-col pl-[.14rem]">
            <div className="flex items-center h-[.42rem]">
              <CustomNumberInput
                value={
                  selectedToken === "LSM ATOM"
                    ? Number(lsmStakeAmount) > 0
                      ? lsmStakeAmount
                      : ""
                    : stakeAmount
                }
                handleValueChange={setStakeAmount}
                fontSize=".24rem"
                placeholder="Amount"
                disabled={selectedToken === "LSM ATOM"}
              />

              {selectedToken === "Staked ATOM" && (
                <div>
                  <CustomButton
                    type="stroke"
                    width=".63rem"
                    height=".36rem"
                    fontSize=".16rem"
                    border="none"
                    className="bg-color-bg1 border-color-border1"
                    onClick={clickMax}
                  >
                    Max
                  </CustomButton>
                </div>
              )}
            </div>

            <div className="mt-[.1rem] flex items-center justify-between text-[.14rem]">
              <div className="text-color-text2">
                {stakeValue
                  ? `$${formatNumber(stakeValue, { decimals: 2 })}`
                  : ""}{" "}
              </div>

              <div
                className={classNames(
                  "flex items-center",
                  selectedToken === "LSM ATOM" ? "cursor-pointer" : "'"
                )}
                onClick={() => {
                  if (selectedToken === "LSM ATOM") {
                    tokenListPopupState.open();
                  } else {
                    // setGetLsmModalOpen(true);
                  }
                }}
              >
                <div className="text-color-text2">Balance</div>
                <div className="ml-[.06rem] text-color-text1">
                  {formatNumber(
                    selectedToken === "Staked ATOM" ? balance : lsmBalance
                  )}
                </div>

                {selectedToken === "LSM ATOM" && (
                  <div className="ml-[.1rem] flex items-center">
                    <Icomoon icon="right" color="#6C86AD" size=".11rem" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedToken === "Staked ATOM" ? (
        <CustomButton
          loading={stakeLoading}
          disabled={buttonDisabled}
          mt=".18rem"
          className="mx-[.24rem]"
          height=".56rem"
          border="none"
          type={isButtonSecondary ? "secondary" : "primary"}
          onClick={clickStake}
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
      ) : (
        <CustomButton
          loading={stakeLoading}
          disabled={lsmButtonDisabled}
          mt=".18rem"
          className="mx-[.24rem]"
          height=".56rem"
          border="none"
          type={lsmButtonSecondary ? "secondary" : "primary"}
          onClick={clickLsmStake}
        >
          <div className="flex items-center">{lsmBbuttonText}</div>
        </CustomButton>
      )}

      <div
        className="mx-[.75rem] mt-[.24rem] grid items-stretch font-[500]"
        style={{ gridTemplateColumns: "40% 30% 30%" }}
      >
        <div className="flex justify-start ml-[.18rem]">
          <div className="flex flex-col items-center">
            <div className="text-text2/50 dark:text-text2Dark/50 text-[.14rem]">
              Will Receive
            </div>
            <div className="mt-[.1rem] text-color-text2 text-[.16rem]">
              {formatLargeAmount(willReceiveAmount)} {getLsdTokenName()}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-text2/50 dark:text-text2Dark/50 text-[.14rem]">
            APR
          </div>

          {apr !== undefined ? (
            <div className="mt-[.1rem] text-color-text2 text-[.16rem]">
              {formatNumber(apr, { decimals: 2, toReadable: false })}%
            </div>
          ) : (
            <div className="mt-[.1rem]">
              <DataLoading height=".16rem" />
            </div>
          )}
        </div>

        <div className="flex justify-end mr-[.0rem]">
          <div className="flex flex-col items-center">
            <div className="text-text2/50 dark:text-text2Dark/50 text-[.14rem]">
              Est. Cost
            </div>

            <div className="mt-[.1rem] text-color-text2 text-[.16rem]">
              ${formatNumber(transactionCostValue, { decimals: 2 })}
            </div>
          </div>
        </div>
      </div>

      <Popover
        {...bindPopover(tokenListPopupState)}
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
      >
        <div
          className={classNames(
            "max-h-[6rem] overflow-auto",
            darkMode ? "dark" : "",
            selectedToken === "LSM ATOM" ? "w-[5.9rem]" : "w-[2.8rem]"
          )}
        >
          {supportTokenList.length === 0 && (
            <div className="flex justify-center my-[.4rem]">
              <EmptyContent size="0.6rem" />
            </div>
          )}

          {supportTokenList.map((item, index) => (
            <div key={item}>
              <div
                className={classNames(
                  "flex items-center justify-between h-[.5rem]  mx-[.12rem]",
                  "cursor-pointer"
                )}
                onClick={() => {
                  setSelectedToken(item);
                  if (item === "Staked ATOM") {
                    tokenListPopupState.close();
                  }
                }}
              >
                <div className="flex items-center ">
                  <div className="w-[.2rem] h-[.2rem] relative">
                    <Image alt="logo" layout="fill" src={getTokenIcon()} />
                  </div>
                  <div className="ml-[.06rem] text-color-text1 text-[.14rem]">
                    <MyTooltip
                      text={item}
                      title={
                        item === "Staked ATOM"
                          ? "The ATOM staked in COSMOS Hub."
                          : "The ATOM that are transferred into tokenized delegations, the liquid staking process is initiated with the Liquid Staking Module tokenizing existing staked ATOM delegations and converting them into NFTs (tokenized delegations) with attributes like reward address, validator, etc."
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="ml-[.12rem]">
                    {selectedToken === item ? (
                      <Icomoon
                        icon="checked-circle"
                        size=".16rem"
                        color="#5A5DE0"
                      />
                    ) : (
                      <div className="w-[.16rem] h-[.16rem] rounded-full border-solid border-[1px] border-text2 dark:border-text2Dark" />
                    )}
                  </div>
                </div>
              </div>

              <div className="h-[1px] mx-[.12rem] bg-color-popoverDivider" />
            </div>
          ))}

          <div
            className={classNames(
              "mx-[.12rem] bg-color-bgPage rounded-[.16rem] mt-[-.1rem] max-h-[2.5rem] min-h-[2rem] overflow-auto",
              selectedToken !== "LSM ATOM" || walletNotConnected ? "hidden" : ""
            )}
          >
            <div
              className="grid items-center py-[.12rem] text-color-text2 text-[.14rem]"
              style={{ gridTemplateColumns: "2.52rem 25% 25%" }}
            >
              <div className="pl-[.16rem]">Validator Name</div>
              <div className="pl-[.24rem]">Record ID</div>
              <div>Amount</div>
            </div>

            <div className="bg-[#6C86AD33] h-[.01rem]" />

            {!lsmBalances ||
              (lsmBalances.length === 0 && (
                <div className="mt-[.4rem]">
                  <EmptyContent />
                </div>
              ))}

            {lsmBalances.map((lsmBalance, index) => (
              <LsmBalanceDataItem
                key={lsmBalance.recordId}
                lsmBalance={lsmBalance}
                tokenKeplrChainId={lsdTokenChainConfig.chainId}
                inEdit={lsmBalanceInEditStore[lsmBalance.recordId] || false}
                onChangeInEdit={() => {
                  lsmBalanceInEditStore[lsmBalance.recordId] =
                    !lsmBalanceInEditStore[lsmBalance.recordId];
                  setLsmBalanceInEditStore({
                    ...lsmBalanceInEditStore,
                  });

                  lsmBalanceInputAmountStore[lsmBalance.recordId] =
                    chainAmountToHuman(lsmBalance.balance.amount);
                  setLsmBalanceInputAmountStore({
                    ...lsmBalanceInputAmountStore,
                  });
                }}
                selected={lsmBalanceSelectedStore[lsmBalance.recordId] || false}
                onChangeSelected={() => {
                  lsmBalanceSelectedStore[lsmBalance.recordId] =
                    !lsmBalanceSelectedStore[lsmBalance.recordId];
                  setLsmBalanceSelectedStore({
                    ...lsmBalanceSelectedStore,
                  });

                  // if (!lsmBalanceSelectedStore[lsmBalance.recordId]) {
                  //   lsmBalanceInEditStore[lsmBalance.recordId] = false;
                  //   setLsmBalanceInEditStore({
                  //     ...lsmBalanceInEditStore,
                  //   });
                  // }
                }}
                inputAmount={
                  lsmBalanceInputAmountStore[lsmBalance.recordId] || ""
                }
                onChangeInputAmount={(value) => {
                  lsmBalanceInputAmountStore[lsmBalance.recordId] = value;
                  setLsmBalanceInputAmountStore({
                    ...lsmBalanceInputAmountStore,
                  });
                }}
              />
            ))}
          </div>

          {selectedToken === "LSM ATOM" && (
            <CustomButton
              loading={stakeLoading}
              disabled={lsmButtonDisabled}
              mt=".16rem"
              className="mx-[.24rem]"
              height=".56rem"
              type={lsmButtonSecondary ? "secondary" : "primary"}
              border="none"
              onClick={clickLsmStake}
            >
              <div className="flex items-center">{lsmBbuttonText}</div>
            </CustomButton>
          )}

          <div className="flex justify-center">
            <div
              className="cursor-pointer px-[.12rem] mx-[.16rem] my-[.1rem] h-[.34rem] inline-flex items-center justify-center"
              onClick={() => {
                router.push({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    tab: "stake",
                  },
                });
              }}
            >
              <div className="text-color-text2 text-[.14rem]">
                Go stake ATOM directly
              </div>

              <div className="rotate-[-90deg] ml-[.12rem] opacity-50">
                <Icomoon icon="arrow-down" size=".1rem" color="#848B97" />
              </div>
            </div>
          </div>
        </div>
      </Popover>
    </div>
  );
};

interface LsmBalanceDataItemProps {
  tokenKeplrChainId: string | undefined;
  lsmBalance: LsmBalanceItem;
  inEdit: boolean;
  onChangeInEdit: () => void;
  selected: boolean;
  onChangeSelected: () => void;
  inputAmount: string;
  onChangeInputAmount: (value: string) => void;
}

const LsmBalanceDataItem = (props: LsmBalanceDataItemProps) => {
  const {
    tokenKeplrChainId,
    lsmBalance,
    inEdit,
    selected,
    inputAmount,
    onChangeInputAmount,
    onChangeSelected,
    onChangeInEdit,
  } = props;
  const [moniker, setMoniker] = useState<string>();
  const [useDefault, setUseDefault] = useState(false);
  const [hideAvatarLoading, setHideAvatarLoading] = useState(false);
  const { darkMode } = useAppSlice();

  useDebouncedEffect(
    () => {
      if (!tokenKeplrChainId) {
        return;
      }

      (async () => {
        const validatorResponse = await queryStakingValidator(
          lsdTokenChainConfig,
          lsmBalance.validatorAddr
        );

        setMoniker(validatorResponse?.validator?.description?.moniker || "");
      })();
    },
    [lsmBalance.validatorAddr, tokenKeplrChainId],
    2000
  );

  const exceedLimit = useMemo(() => {
    if (!inEdit) {
      return false;
    }
    return (
      Number(inputAmount) >
      Number(chainAmountToHuman(lsmBalance.balance.amount))
    );
  }, [inputAmount, inEdit, lsmBalance]);

  return (
    <>
      <div
        className="grid items-center py-[.16rem] text-color-text2 text-[.14rem]"
        style={{ gridTemplateColumns: "2.52rem 25% 25%" }}
      >
        <div
          className="pl-[.16rem] flex items-center cursor-pointer"
          onClick={onChangeSelected}
        >
          {selected ? (
            <Icomoon icon="checked" size=".16rem" color="#5A5DE0" />
          ) : (
            <div className="w-[.16rem] h-[.16rem] rounded-[.03rem] border-solid border-[1px] border-color-border3" />
          )}

          <div className="ml-[.12rem] w-[.28rem] h-[.28rem] relative">
            {!hideAvatarLoading && (
              <div className="absolute left-0 right-0 top-0 bottom-0">
                <Skeleton
                  variant="circular"
                  animation="pulse"
                  height={".28rem"}
                  sx={{
                    fontSize: ".28rem",
                    bgcolor: darkMode ? "grey.900" : "grey.100",
                  }}
                />
              </div>
            )}

            <Image
              src={
                useDefault
                  ? defaultAvatar
                  : `https://raw.githubusercontent.com/cosmostation/chainlist/master/chain/cosmos/moniker/${lsmBalance.validatorAddr}.png`
              }
              alt="icon"
              layout="fill"
              onError={() => {
                setUseDefault(true);
                setHideAvatarLoading(true);
              }}
              onLoadingComplete={() => {
                setHideAvatarLoading(true);
              }}
            />
          </div>

          <div
            className="ml-[.12rem] text-[.16rem] text-color-text1 max-w-[1.68rem] w-[1.68rem]"
            style={{
              maxLines: 2,
              WebkitLineClamp: 2,
              lineClamp: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
            }}
          >
            {moniker === undefined ? (
              <DataLoading height=".16rem" width=".6rem" />
            ) : (
              moniker
            )}
          </div>
        </div>

        <div
          className="pl-[.24rem] text-[.16rem] text-color-text1 cursor-pointer"
          onClick={onChangeSelected}
        >
          {lsmBalance.recordId}
        </div>

        <div>
          {inEdit ? (
            <div
              className={classNames(
                "py-[.1rem] px-[.06rem] rounded-[.06rem] ",
                exceedLimit
                  ? "bg-[#FEA4FF33] border-solid border-[0.01rem] border-[#FEA4FF]"
                  : "bg-bgHover dark:bg-bgHoverDark"
              )}
            >
              <CustomNumberInput
                placeholder={chainAmountToHuman(lsmBalance.balance.amount)}
                value={inputAmount}
                handleValueChange={onChangeInputAmount}
                fontSize=".16rem"
              />
            </div>
          ) : (
            <div
              className="text-[.16rem] py-[.1rem] px-[.06rem] rounded-[.06rem] border-solid border-[.01rem] border-[#6C86AD33] cursor-pointer"
              onClick={onChangeInEdit}
            >
              {chainAmountToHuman(lsmBalance.balance.amount)}
            </div>
          )}
        </div>
      </div>

      {inEdit && !exceedLimit && (
        <div className="flex justify-end">
          <div
            className="text-[.14rem] text-color-text2 mr-[.32rem] cursor-pointer"
            onClick={() => {
              onChangeInputAmount(
                chainAmountToHuman(lsmBalance.balance.amount)
              );
            }}
          >
            Max {chainAmountToHuman(lsmBalance.balance.amount)}
          </div>
        </div>
      )}

      {exceedLimit && (
        <div
          className="flex justify-center items-center h-[.42rem]"
          style={{
            background: "linear-gradient(90deg, #FEA4FF 0%, #80CAFF 96.25%)",
          }}
        >
          <div className="text-[.16rem] text-color-text1 ">
            max amount is {chainAmountToHuman(lsmBalance.balance.amount)}
          </div>
        </div>
      )}
    </>
  );
};
