import { lsdTokenChainConfig, neutronChainConfig } from "config/chain";
import { useAppDispatch, useAppSelector } from "hooks/common";
import { useCosmosChainAccount } from "hooks/useCosmosChainAccount";
import { ChainConfig } from "interfaces/common";
import { useMemo } from "react";
import { WithdrawInfo, handleTokenWithdraw } from "redux/reducers/TokenSlice";
import { connectKeplrAccount } from "redux/reducers/WalletSlice";
import { RootState } from "redux/store";
import { getEstWithdrawFee, getTokenName } from "utils/configUtils";
import { amountToChain, formatNumber } from "utils/numberUtils";
import { formatWithdrawRemaingTime } from "utils/timeUtils";
import { CustomButton } from "../common/CustomButton";

interface Props {
  withdrawInfo: WithdrawInfo;
}

export const WithdrawUnstaked = (props: Props) => {
  const { withdrawInfo } = props;

  const dispatch = useAppDispatch();
  const { withdrawLoading } = useAppSelector((state: RootState) => {
    return { withdrawLoading: state.app.withdrawLoading };
  });

  const neutronAccount = useCosmosChainAccount(neutronChainConfig.chainId);
  const lsdTokenAccount = useCosmosChainAccount(lsdTokenChainConfig.chainId);

  const withdrawDisabled = useMemo(() => {
    return (
      isNaN(Number(withdrawInfo.avaiableWithdraw)) ||
      Number(withdrawInfo.avaiableWithdraw) <= 0 ||
      !withdrawInfo.neutronUnstakeIndexList ||
      withdrawInfo.neutronUnstakeIndexList.length === 0 ||
      withdrawLoading
    );
  }, [withdrawInfo, withdrawLoading]);

  const walletNotConnected = useMemo(() => {
    if (!lsdTokenAccount || !neutronAccount) {
      return true;
    }
    return false;
  }, [lsdTokenAccount, neutronAccount]);

  const noEnoughNtrnFee = useMemo(() => {
    const ntrnBalance = neutronAccount?.allBalances?.find(
      (item) => item.denom === neutronChainConfig.denom
    );
    // console.log({ ntrnBalance });

    if (
      !ntrnBalance ||
      Number(ntrnBalance.amount) <
        Number(amountToChain(getEstWithdrawFee() + ""))
    ) {
      return true;
    }

    return false;
  }, [neutronAccount]);

  const [buttonText, buttonDisabled, isButtonSecondary] = useMemo(() => {
    if (withdrawDisabled) {
      return ["Withdraw", withdrawDisabled, false];
    }
    if (walletNotConnected) {
      return ["Connect Wallet", false, true];
    }
    if (noEnoughNtrnFee) {
      return ["Insufficient NTRN Fee", true, false];
    }
    return ["Withdraw", withdrawDisabled, false];
  }, [walletNotConnected, withdrawDisabled, noEnoughNtrnFee]);

  const clickWithdraw = () => {
    if (walletNotConnected) {
      const connectChainConfigs: ChainConfig[] = [];
      if (!neutronAccount) {
        connectChainConfigs.push(neutronChainConfig);
      }
      if (!lsdTokenAccount) {
        connectChainConfigs.push(lsdTokenChainConfig);
      }
      dispatch(connectKeplrAccount(connectChainConfigs));
      return;
    }

    if (
      withdrawDisabled ||
      !withdrawInfo.neutronUnstakeIndexList ||
      !withdrawInfo.avaiableWithdraw ||
      !lsdTokenAccount
    ) {
      return;
    }
    dispatch(
      handleTokenWithdraw(
        withdrawInfo.neutronUnstakeIndexList,
        withdrawInfo.avaiableWithdraw,
        lsdTokenAccount?.bech32Address
      )
    );
  };

  return (
    <div className="mt-[.18rem] bg-color-bg2 rounded-[.3rem] border-color-border1 border-[.01rem]">
      <div className="mt-[.28rem] mx-[.24rem] flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center cursor-pointer">
            <div className="text-[.14rem] text-color-text2 opacity-50 font-[500]">
              Withdraw Amount
            </div>
          </div>
          <div className="text-[.16rem] text-text2 dark:text-text1Dark font-[500] ml-[.12rem] mt-[.02rem]">
            {formatNumber(withdrawInfo.overallAmount)} {getTokenName()}
          </div>
        </div>
        <div className="flex items-center">
          <div className="text-[.14rem] font-[500] text-text2/50 dark:text-text2Dark/50">
            Est. Remaining Lock Time
          </div>
          <div className="text-[.16rem] text-color-text2 font-[500] ml-[.12rem] mt-[.02rem]">
            {formatWithdrawRemaingTime(Number(withdrawInfo.remainingTime))}
          </div>
        </div>
      </div>

      <div className="mt-[.24rem] mx-[.24rem] flex items-center justify-center relative h-[.77rem] rounded-[.12rem] bg-color-bgPage">
        <div className="text-[.14rem] font[500] text-color-text1 absolute left-[.23rem]">
          Withdrawable Now
        </div>
        <div className="text-[.24rem] text-color-text2 font-[500]">
          {formatNumber(withdrawInfo.avaiableWithdraw)} {getTokenName()}
        </div>
      </div>

      <div className="mt-[.24rem] mx-[.24rem] mb-[.32rem]">
        <CustomButton
          type={isButtonSecondary ? "secondary" : "primary"}
          height=".56rem"
          disabled={buttonDisabled}
          loading={withdrawLoading}
          border="none"
          onClick={() => {
            clickWithdraw();
          }}
        >
          {buttonText}
        </CustomButton>
      </div>
    </div>
  );
};
