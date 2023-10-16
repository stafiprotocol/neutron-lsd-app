import { CustomButton } from "../common/CustomButton";
import { useAppDispatch, useAppSelector } from "hooks/common";
import { RootState } from "redux/store";
import { formatNumber } from "utils/numberUtils";
import { useEffect, useMemo } from "react";
import {
  handleTokenWithdraw,
  updateWithdrawRelayFee,
  WithdrawInfo,
} from "redux/reducers/TokenSlice";
import { useContractWrite } from "wagmi";
import {
  getStakeManagerContract,
  getStakeManagerContractAbi,
} from "config/contract";
import { getEvmChainId } from "config/env";
import { useRelayFee } from "hooks/useRelayFee";
import snackbarUtil from "utils/snackbarUtils";
import { NETWORK_ERR_MESSAGE } from "constants/common";
import { getTokenName, needRelayFee } from "utils/configUtils";
import { formatWithdrawRemaingTime } from "utils/timeUtils";

interface Props {
  withdrawInfo: WithdrawInfo;
}

export const WithdrawUnstaked = (props: Props) => {
  const { withdrawInfo } = props;

  const dispatch = useAppDispatch();
  const { withdrawLoading } = useAppSelector((state: RootState) => {
    return { withdrawLoading: state.app.withdrawLoading };
  });

  const { relayFee } = useRelayFee();

  const { writeAsync } = useContractWrite({
    address: getStakeManagerContract() as `0x${string}`,
    abi: getStakeManagerContractAbi(),
    functionName: "withdraw",
    args: [],
    chainId: getEvmChainId(),
  });

  const withdrawDisabled = useMemo(() => {
    return (
      isNaN(Number(withdrawInfo.avaiableWithdraw)) ||
      Number(withdrawInfo.avaiableWithdraw) <= 0 ||
      withdrawLoading
    );
  }, [withdrawInfo, withdrawLoading]);

  const clickWithdraw = () => {
    if (withdrawDisabled) {
      return;
    }
    if (needRelayFee() && isNaN(Number(relayFee.withdraw))) {
      snackbarUtil.error(NETWORK_ERR_MESSAGE);
      return;
    }
    dispatch(
      handleTokenWithdraw(
        writeAsync,
        relayFee.withdraw + "",
        withdrawInfo.avaiableWithdraw + ""
      )
    );
  };

  useEffect(() => {
    dispatch(updateWithdrawRelayFee());
  }, [dispatch]);

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
          type="primary"
          height=".56rem"
          disabled={withdrawDisabled}
          loading={withdrawLoading}
          border="none"
          onClick={() => {
            clickWithdraw();
          }}
        >
          Withdraw
        </CustomButton>
      </div>
    </div>
  );
};
