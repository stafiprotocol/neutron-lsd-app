import classNames from "classnames";
import { useRouter } from "next/router";
import { useMemo } from "react";

interface Props {
  selectedTab: "stake" | "unstake" | "liquidStake" | "withdraw" | "bridge";
  onChangeTab: (
    tab: "stake" | "unstake" | "liquidStake" | "withdraw" | "bridge"
  ) => void;
  showWithdrawTab?: boolean;
  showLiquidStakeTab?: boolean;
}

export const DashboardTabs = (props: Props) => {
  const router = useRouter();
  const { showWithdrawTab, showLiquidStakeTab } = props;

  const showWithdraw = useMemo(() => {
    return showWithdrawTab || router.query.tab === "withdraw";
  }, [router.query, showWithdrawTab]);

  return (
    <div
      className={classNames(
        "p-[.04rem] h-[.42rem] grid items-stretch bg-color-bg2 rounded-[.3rem]",
        showLiquidStakeTab && showWithdraw ? "w-[4rem]" : "w-[3.2rem]"
      )}
      style={{
        gridTemplateColumns:
          showLiquidStakeTab && showWithdraw
            ? "20% 30% 30% 20%"
            : "30% 40% 30%",
      }}
    >
      <div
        className={classNames(
          "cursor-pointer flex items-center justify-center text-[.16rem] rounded-[.3rem]",
          props.selectedTab === "stake" || props.selectedTab === "unstake"
            ? "text-color-highlight bg-color-highlight"
            : "text-color-text1"
        )}
        onClick={() => props.onChangeTab("stake")}
      >
        Stake
      </div>

      {showLiquidStakeTab && (
        <div
          className={classNames(
            "cursor-pointer flex items-center justify-center text-[.16rem] rounded-[.3rem]",
            props.selectedTab === "liquidStake"
              ? "text-color-highlight bg-color-highlight"
              : "text-color-text1"
          )}
          onClick={() => props.onChangeTab("liquidStake")}
        >
          Liquid Stake
        </div>
      )}

      {showWithdraw && (
        <div className="flex items-stretch">
          <div className="ml-[.1rem] w-[0.01rem] h-[.22rem] bg-[#DEE6F7] dark:bg-bg1Dark self-center" />
          <div
            className={classNames(
              "flex-1 ml-[.1rem] cursor-pointer flex items-center justify-center text-[.16rem] rounded-[.3rem]",
              props.selectedTab === "withdraw"
                ? "text-color-highlight bg-color-highlight"
                : "text-color-text1"
            )}
            onClick={() => props.onChangeTab("withdraw")}
          >
            Withdraw
          </div>
        </div>
      )}

      <div
        className={classNames(
          "cursor-pointer flex items-center justify-center text-[.16rem] rounded-[.3rem]",
          props.selectedTab === "bridge"
            ? "text-color-highlight bg-color-highlight"
            : "text-color-text1"
        )}
        onClick={() => props.onChangeTab("bridge")}
      >
        Bridge
      </div>
    </div>
  );
};
