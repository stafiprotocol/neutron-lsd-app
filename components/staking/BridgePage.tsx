import classNames from "classnames";
import Image from "next/image";
import defaultAvatar from "public/images/default_avatar.png";
import { useEffect, useMemo, useState } from "react";
import { getShortAddress } from "utils/stringUtils";
import userAvatar from "public/images/user_avatar.png";
import { CustomInput } from "components/common/CustomInput";
import checkValid from "public/images/check_valid.svg";
import checkInvalid from "public/images/check_invalid.svg";
import { Icomoon } from "components/icon/Icomoon";
import { useAppDispatch, useAppSelector } from "hooks/common";
import { useRouter } from "next/router";
import { CustomButton } from "components/common/CustomButton";
import { CustomNumberInput } from "components/common/CustomNumberInput";
import { chainAmountToHuman, formatNumber } from "utils/numberUtils";
import { BridgeChainSelector } from "components/bridge/BridgeChainSelector";
import {
  bridgeTargetsChainConfig,
  bridgeNeutronChainConfig,
} from "config/bridge";
import { ChainConfig } from "interfaces/common";
import { useCosmosChainAccount } from "hooks/useCosmosChainAccount";
import { lsdTokenChainConfig, neutronChainConfig } from "config/chain";
import { connectKeplrAccount } from "redux/reducers/WalletSlice";
import { useBalance } from "hooks/useBalance";
import { bridgeFromNeutron, bridgeToNeutron } from "redux/reducers/BridgeSlice";
import snackbarUtil from "utils/snackbarUtils";
import { updateTargetsChainTokenBalances } from "redux/reducers/BridgeSlice";
import { useLsdTokenRate } from "hooks/useLsdTokenRate";
import { usePrice } from "hooks/usePrice";
import { getLsdTokenIcon } from "utils/iconUtils";
import { getLsdTokenName } from "utils/configUtils";

const BridgePage = () => {
  const dispatch = useAppDispatch();
  const { darkMode, bridgeLoading } = useAppSelector((state) => state.app);
  const { balances: bridgeChainBalances } = useAppSelector(
    (state) => state.bridge
  );

  const { lsdBalance } = useBalance();
  const lsdTokenRate = useLsdTokenRate();
  const { ntrnPrice, tokenPrice } = usePrice();

  const [senderAddress, setSrcAddress] = useState("");
  const [editAddress, setEditAddress] = useState(false);
  const [inputEditAddress, setInputEditAddress] = useState("");
  const [receivingAddress, setReceivingAddress] = useState("");

  const [bridgeAmount, setBridgeAmount] = useState("");
  const [srcChain, setSrcChain] = useState<ChainConfig | undefined>(
    bridgeNeutronChainConfig
  );
  const [dstChain, setDstChain] = useState<ChainConfig | undefined>(
    bridgeTargetsChainConfig[0]
  );

  const srcAccount = useCosmosChainAccount(srcChain?.chainId);
  const dstAccount = useCosmosChainAccount(dstChain?.chainId);

  const walletNotConnected = useMemo(() => {
    return !srcAccount || !dstAccount;
  }, [srcAccount, dstAccount]);

  const balance = useMemo(() => {
    if (!srcChain) return;

    if (srcChain.chainId === bridgeNeutronChainConfig.chainId) {
      return lsdBalance;
    } else {
      return chainAmountToHuman(
        bridgeChainBalances[srcChain.chainId],
        srcChain.decimals
      );
    }
  }, [srcChain, lsdBalance, bridgeChainBalances]);

  const addressCorrect = useMemo(() => {
    const checkAddress = editAddress ? inputEditAddress : receivingAddress;

    if (!checkAddress) {
      return false;
    }

    // return validateStafiHubAddress(checkAddress);
    return true;
  }, [receivingAddress, editAddress, inputEditAddress]);

  const bridgeValue = useMemo(() => {
    if (
      !bridgeAmount ||
      isNaN(Number(bridgeAmount)) ||
      Number(bridgeAmount) === 0 ||
      isNaN(Number(tokenPrice)) ||
      isNaN(Number(lsdTokenRate))
    ) {
      return "--";
    }
    return Number(bridgeAmount) * Number(tokenPrice) * Number(lsdTokenRate);
  }, [bridgeAmount, tokenPrice, lsdTokenRate]);

  const [buttonDisabled, buttonText] = useMemo(() => {
    if (walletNotConnected) {
      const text =
        !srcAccount && !dstAccount
          ? "Connect Wallet"
          : !srcAccount
          ? `Connect ${srcChain?.chainName || "Wallet"}`
          : `Connect ${dstChain?.chainName || "Wallet"}`;
      return [false, text];
    }
    if (
      !bridgeAmount ||
      isNaN(Number(bridgeAmount)) ||
      Number(bridgeAmount) <= 0 ||
      isNaN(Number(balance))
    ) {
      return [true, "Swap"];
    }
    if (Number(bridgeAmount) > Number(balance)) {
      return [true, "Insufficient Balance"];
    }
    return [false, "Swap"];
  }, [
    walletNotConnected,
    srcAccount,
    dstChain,
    dstAccount,
    bridgeAmount,
    balance,
  ]);

  const clickConnectWallet = async () => {
    if (!dstChain || !srcChain) return;
    const connectChainConfigs: ChainConfig[] = [];
    if (!srcAccount) {
      connectChainConfigs.push(srcChain);
    }
    if (!dstAccount) {
      connectChainConfigs.push(dstChain);
    }
    console.log(connectChainConfigs);
    dispatch(connectKeplrAccount(connectChainConfigs));
  };

  const clickSwap = () => {
    if (walletNotConnected) {
      clickConnectWallet();
      return;
    }
    if (!srcChain || !dstChain) {
      snackbarUtil.error("Please select chain");
      return;
    }
    if (srcChain.chainId === bridgeNeutronChainConfig.chainId) {
      dispatch(
        bridgeFromNeutron(
          bridgeAmount,
          srcChain,
          dstChain,
          receivingAddress,
          (success) => {
            if (success) {
              setBridgeAmount("");
            }
          }
        )
      );
    } else {
      if (!srcAccount) {
        snackbarUtil.error("Please connect wallet");
        return;
      }
      dispatch(
        bridgeToNeutron(
          bridgeAmount,
          srcAccount,
          receivingAddress,
          srcChain,
          dstChain,
          (success) => {
            if (success) {
              setBridgeAmount("");
            }
          }
        )
      );
    }
  };

  useEffect(() => {
    if (!dstChain) {
      setReceivingAddress("");
    } else {
      setReceivingAddress(dstAccount?.bech32Address || "");
    }
  }, [dstChain, dstAccount]);

  useEffect(() => {
    dispatch(updateTargetsChainTokenBalances());
  }, [dispatch]);

  return (
    <div>
      <div className="mb-[.32rem] bg-color-bg2 border-[0.02rem] border-color-border1 rounded-[.3rem] flex flex-col items-stretch py-[.36rem] px-[.24rem]">
        <div
          className={classNames(
            "h-[1.07rem] justify-between items-stretch flex"
          )}
        >
          <div className="ml-[.0rem] flex flex-col items-start">
            <div className="mt-[.16rem] text-color-text2 text-[.14rem]">
              Send From
            </div>

            <div
              className={classNames(
                "mt-[.06rem] flex items-center h-[.42rem] justify-between bg-color-bg2 border-color-border4 border-solid border-[0.01rem] overflow-hidden rounded-[.6rem] p-[.04rem] "
              )}
            >
              <div className="w-[.34rem] h-[.34rem] relative">
                <Image src={defaultAvatar} alt="avatar" layout="fill" />
              </div>

              {srcAccount && !editAddress && (
                <div className="mx-[.12rem] text-[.14rem] text-color-text1">
                  {getShortAddress(srcAccount.bech32Address, 5)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="mt-[.16rem] text-color-text2 text-[.14rem]">
              Receiving Address
            </div>

            <div className="mt-[.06rem] flex items-center rounded-[.3rem] justify-between">
              <div
                className={classNames(
                  "h-[.42rem] flex items-center rounded-[.4rem] border-solid border-[0.01rem] border-color-border4 bg-color-bg2 overflow-hidden",
                  !editAddress ? "cursor-pointer" : ""
                )}
                onClick={() => {
                  if (!editAddress) {
                    setInputEditAddress(receivingAddress);
                    setEditAddress(true);
                  }
                }}
              >
                <div className="ml-[.04rem] w-[.34rem] min-w-[.34rem] h-[.34rem] relative">
                  <Image src={userAvatar} alt="avatar" layout="fill" />
                </div>

                {!editAddress ? (
                  <div className="mx-[.12rem] text-[.14rem] text-color-text1">
                    {getShortAddress(receivingAddress, 5)}
                  </div>
                ) : (
                  <div className="flex-1 mx-[.12rem] w-[3rem] max-w-[3rem]">
                    <CustomInput
                      value={inputEditAddress}
                      handleValueChange={setInputEditAddress}
                      placeholder="Receiving Address"
                      fontSize=".14rem"
                    />
                  </div>
                )}
              </div>

              {editAddress && (
                <div className="flex items-center">
                  <div
                    className={classNames(
                      "ml-[.06rem] w-[.22rem] min-w-[.22rem] h-[.22rem] relative",
                      addressCorrect ? "cursor-pointer" : ""
                    )}
                    onClick={() => {
                      if (addressCorrect) {
                        setReceivingAddress(inputEditAddress);
                        setEditAddress(false);
                      }
                    }}
                  >
                    <Image
                      src={addressCorrect ? checkValid : checkInvalid}
                      alt="avatar"
                      layout="fill"
                    />
                  </div>

                  <div
                    className="ml-[.1rem] text-color-text2 text-[.14rem] cursor-pointer"
                    onClick={() => {
                      setEditAddress(false);
                    }}
                  >
                    Cancel
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-[1.07rem] bg-color-bgPage rounded-[.3rem] flex justify-between items-stretch">
          <div className="ml-[.12rem]">
            <div className="ml-[.12rem] mt-[.16rem] text-color-text2 text-[.14rem]">
              Bridge From
            </div>

            <BridgeChainSelector
              isFrom
              options={[bridgeNeutronChainConfig, ...bridgeTargetsChainConfig]}
              selectedChain={srcChain}
              onChange={(chain) => {
                if (chain.chainId !== bridgeNeutronChainConfig.chainId) {
                  setDstChain(bridgeNeutronChainConfig);
                } else {
                  setDstChain(bridgeTargetsChainConfig[0]);
                }
                setSrcChain(chain);
              }}
            />
          </div>

          <div className="mt-[.4rem] mx-[.27rem] w-[.36rem] h-[.36rem] flex items-center justify-center rounded-[.06rem] bg-bgHover dark:bg-bgHoverDark">
            <Icomoon
              icon="arrow-right"
              size=".16rem"
              color={darkMode ? "#ffffff80" : "#222C3C"}
            />
          </div>

          <div className="mr-[.12rem]">
            <div className="ml-[.12rem] mt-[.16rem] text-color-text2 text-[.14rem]">
              Bridge To
            </div>

            <BridgeChainSelector
              options={[...bridgeTargetsChainConfig, bridgeNeutronChainConfig]}
              selectedChain={dstChain}
              onChange={(chain) => {
                if (chain.chainId === bridgeNeutronChainConfig.chainId) {
                  setSrcChain(bridgeTargetsChainConfig[0]);
                } else {
                  setSrcChain(bridgeNeutronChainConfig);
                }
                setDstChain(chain);
              }}
            />
          </div>
        </div>

        <div className="mt-[.12rem] h-[1.07rem] px-[.12rem] bg-color-bgPage rounded-[.3rem] flex justify-between">
          <div className="mt-[.24rem]">
            <div
              className={classNames(
                "w-[1.6rem] h-[.42rem] flex items-center justify-between rounded-[.6rem] bg-color-bg2"
              )}
            >
              <div className="flex items-center">
                <div
                  className={classNames(
                    "w-[.34rem] h-[.34rem] min-w-[.34rem] relative ml-[.04rem]"
                  )}
                >
                  <Image src={getLsdTokenIcon()} alt="logo" layout="fill" />
                </div>

                <div
                  className={classNames(
                    "ml-[.08rem] text-[.16rem] text-color-text1"
                  )}
                >
                  {getLsdTokenName()}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-[.1rem] ml-[.16rem] flex-1 flex items-center justify-between">
            <div className={classNames()}>
              <div className="h-[.36rem] flex items-center">
                <CustomNumberInput
                  value={bridgeAmount}
                  handleValueChange={setBridgeAmount}
                  placeholder="Amount"
                  fontSize=".24rem"
                />
              </div>

              <div
                className={classNames(
                  "mt-[.12rem] text-[.14rem] text-color-text2",
                  bridgeAmount &&
                    !isNaN(Number(bridgeAmount)) &&
                    Number(bridgeAmount) > 0
                    ? ""
                    : "invisible"
                )}
              >
                {bridgeValue
                  ? `$${formatNumber(bridgeValue, { decimals: 2 })}`
                  : ""}{" "}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div
                className={classNames(
                  "cursor-pointer text-color-text1 text-[.16rem] bg-color-bg2 rounded-[.2rem] w-[.63rem] h-[.36rem] items-center justify-center flex"
                )}
                onClick={() => {
                  if (isNaN(Number(balance))) {
                    return;
                  }
                  let amount = Number(balance);
                  const formatAmount = formatNumber(amount.toString(), {
                    toReadable: false,
                    withSplit: false,
                  });
                  if (isNaN(Number(formatAmount))) {
                    return;
                  }
                  setBridgeAmount(formatAmount);
                }}
              >
                Max
              </div>

              <div className={classNames("flex items-center mt-[.12rem]")}>
                <div className="text-[.14rem] text-color-text2">Balance</div>
                <div className="ml-[.1rem] text-[.16rem] text-color-text1">
                  {formatNumber(balance)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CustomButton
          height=".56rem"
          mt=".2rem"
          type={"primary"}
          disabled={buttonDisabled}
          onClick={clickSwap}
          border="none"
          loading={bridgeLoading}
        >
          <div className="flex items-center">{buttonText}</div>
        </CustomButton>
      </div>
    </div>
  );
};

export default BridgePage;
