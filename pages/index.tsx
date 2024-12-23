import classNames from "classnames";
import { CustomTag } from "components/common/CustomTag";
import { FaqItem } from "components/common/FaqItem";
import { PageTitleContainer } from "components/common/PageTitleContainer";
import { Icomoon } from "components/icon/Icomoon";
import BridgePage from "components/staking/BridgePage";
import { DashboardTabs } from "components/staking/DashboardTabs";
import { RedelegatePage } from "components/staking/RedelegatePage";
import { StakePage } from "components/staking/StakePage";
import { WithdrawUnstaked } from "components/staking/WithdrawUnstaked";
import { neutronChainConfig } from "config/chain";
import { getExplorerAccountUrl } from "config/explorer";
import { useAppSelector } from "hooks/common";
import { useApr } from "hooks/useApr";
import { useBalance } from "hooks/useBalance";
import { useLsdTokenRate } from "hooks/useLsdTokenRate";
import { useWithdrawInfo } from "hooks/useWithdrawInfo";
import Image from "next/image";
import { useRouter } from "next/router";
import auditIcon from "public/images/audit.svg";
import cooperationIcon from "public/images/cooperation.svg";
import { useEffect, useMemo, useState } from "react";
import { RootState } from "redux/store";
import { openLink } from "utils/commonUtils";
import {
  IFaqContent,
  IFaqItem,
  getDetailInfoAudit,
  getDetailInfoListedIns,
  getFaqList,
  getLsdTokenName,
  getSupportChains,
  getTokenName,
  supportLiquidStake,
} from "utils/configUtils";
import { getNeutronPoolInfo } from "utils/cosmosUtils";
import { getLsdTokenIcon } from "utils/iconUtils";
import { formatNumber, getRefinedStakedAmount } from "utils/numberUtils";

const TokenPage = () => {
  const router = useRouter();
  const { apr } = useApr();

  const { withdrawInfo } = useWithdrawInfo();

  const { neutronPoolInfo } = useAppSelector((state: RootState) => {
    return {
      neutronPoolInfo: state.token.neutronPoolInfo,
    };
  });

  const { lsdBalance } = useBalance();
  const rate = useLsdTokenRate();

  const [lsdTokenContract, setLsdTokenContract] = useState("");

  const stakedToken = useMemo(() => {
    if (isNaN(Number(lsdBalance)) || isNaN(Number(rate))) {
      return "--";
    }
    return getRefinedStakedAmount(lsdBalance, rate);
  }, [lsdBalance, rate]);

  const selectedTab = useMemo(() => {
    const tabParam = router.query.tab;
    if (tabParam) {
      switch (tabParam) {
        case "stake":
        case "unstake":
        case "liquidStake":
        case "withdraw":
        case "bridge":
          return tabParam;
        default:
          return "stake";
      }
    }
    return "stake";
  }, [router.query]);

  const showWithdrawTab = useMemo(() => {
    // return true;
    return (
      (!isNaN(Number(withdrawInfo.overallAmount)) &&
        Number(withdrawInfo.overallAmount) > 0) ||
      router.query.tab === "withdraw"
    );
  }, [withdrawInfo, router.query.tab]);

  const showLiquidStake = useMemo(() => {
    return (
      supportLiquidStake() && neutronPoolInfo && neutronPoolInfo.lsm_support
    );
  }, [neutronPoolInfo]);

  const showTab = useMemo(() => {
    return showWithdrawTab || showLiquidStake;
  }, [showWithdrawTab, showLiquidStake]);

  const updateTab = (tab: string) => {
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        tab,
      },
    });
  };

  useEffect(() => {
    (async () => {
      const poolInfo = await getNeutronPoolInfo();
      setLsdTokenContract(poolInfo?.lsd_token || "");
    })();
  }, []);

  const renderFaqContent = (content: IFaqContent, index: number) => {
    if (content.type === "link") {
      if (content.content.endsWith("\n")) {
        return (
          <div className={classNames(index > 0 ? "mt-faqGap" : "")} key={index}>
            <a
              className="text-color-link cursor-pointer"
              href={content.link}
              target="_blank"
              rel="noreferrer"
            >
              {content.content.trimEnd()}
            </a>
          </div>
        );
      } else {
        return (
          <a
            className="text-color-link cursor-pointer"
            href={content.link}
            target="_blank"
            rel="noreferrer"
            key={index}
          >
            {content.content}
          </a>
        );
      }
    } else {
      if (content.content.endsWith("\n")) {
        return (
          <div className={classNames(index > 0 ? "mt-faqGap" : "")} key={index}>
            {content.content}
          </div>
        );
      } else {
        return <span key={index}>{content.content}</span>;
      }
    }
  };

  const renderFaqContents = (contents: IFaqContent[]) => {
    const renderedJSX: React.ReactElement[] = [];
    contents.forEach((content: IFaqContent, index: number) => {
      const contentJSX = renderFaqContent(content, index);
      renderedJSX.push(contentJSX);
    });
    return renderedJSX;
  };

  return (
    <div>
      <PageTitleContainer>
        <div className="h-full flex items-center w-smallContentW xl:w-contentW 2xl:w-largeContentW">
          <div className="w-[.68rem] h-[.68rem] relative">
            <Image src={getLsdTokenIcon()} layout="fill" alt="icon" />
          </div>
          <div className="ml-[.12rem]">
            <div className="flex items-center">
              <div className="text-[.34rem] font-[700] text-color-text1">
                {getLsdTokenName()}
              </div>

              <div className="ml-[.16rem]">
                <CustomTag type="stroke">
                  <div className="text-[.16rem] scale-75 origin-center">
                    CW20
                  </div>
                </CustomTag>
              </div>

              <div className="ml-[.06rem]">
                <CustomTag>
                  <div className="text-[.16rem] scale-75 origin-center flex items-center">
                    <span className="font-[700]">
                      {formatNumber(apr, { decimals: 2, toReadable: false })}%
                    </span>
                    <span className="ml-[.02rem]">APR</span>
                  </div>
                </CustomTag>
              </div>
            </div>

            <div className="mt-[.04rem] text-color-text2 text-[.16rem] scale-75 origin-bottom-left">
              On {getSupportChains().join(", ")} Chain
              {getSupportChains().length > 1 && "s"}
            </div>
          </div>

          {neutronChainConfig && (
            <div className="ml-auto mr-[.56rem] flex flex-col justify-center items-end">
              <div className="text-[.34rem] font-[700] text-color-text1">
                {formatNumber(lsdBalance)}
              </div>
              <div className="text-[.12rem] text-color-text2 mt-[.04rem]">
                {formatNumber(stakedToken)} {getTokenName()} Staked
              </div>
            </div>
          )}
        </div>
      </PageTitleContainer>

      <div className="w-smallContentW xl:w-contentW 2xl:w-largeContentW mx-auto">
        <div className="my-[.36rem] mr-[.56rem]">
          {showTab && (
            <DashboardTabs
              selectedTab={selectedTab}
              onChangeTab={updateTab}
              showWithdrawTab={showWithdrawTab}
              showLiquidStakeTab={showLiquidStake}
            />
          )}

          <div className="mt-[.36rem] flex ">
            <div className={classNames("flex-1 min-w-[6.2rem] w-[6.2rem]")}>
              {(selectedTab === "stake" || selectedTab === "unstake") && (
                <StakePage />
              )}

              {selectedTab === "liquidStake" && <RedelegatePage />}

              {selectedTab === "withdraw" && (
                <WithdrawUnstaked withdrawInfo={withdrawInfo} />
              )}

              {selectedTab === "bridge" && <BridgePage />}
            </div>

            <div className="ml-[.87rem] flex-1">
              <div className="text-[.24rem] text-color-text1">Detail Info</div>

              <div className="mt-[.15rem] bg-color-bg3 rounded-[.12rem] py-[.16rem] px-[.24rem] text-[.14rem]">
                <div className="flex items-center">
                  <div className="w-[.22rem] h-[.22rem] relative">
                    <Image src={auditIcon} alt="audit" layout="fill" />
                  </div>
                  <div className="ml-[.06rem] text-color-text1 font-[700]">
                    Audit
                  </div>
                </div>

                <div
                  className="cursor-pointer mt-[.12rem] text-color-link"
                  onClick={() => {
                    openLink(getDetailInfoAudit().link);
                  }}
                >
                  <span className="mr-[.12rem] dark:text-linkDark/50">
                    Audited By {getDetailInfoAudit().nameList.join(", ")}
                  </span>
                  <span className="min-w-[.15rem] min-h-[.15rem]">
                    <Icomoon icon="share" size=".12rem" />
                  </span>
                </div>

                <div className="mt-[.16rem] flex items-center">
                  <div className="w-[.22rem] h-[.22rem] relative">
                    <Image src={cooperationIcon} alt="audit" layout="fill" />
                  </div>

                  <div className="ml-[.06rem] text-color-text1 font-[700]">
                    Listed In
                  </div>
                </div>
                {getDetailInfoListedIns().map(
                  (item: { name: string; link: string }) => (
                    <div
                      className="cursor-pointer mt-[.12rem] text-color-link"
                      onClick={() => {
                        openLink(item.link);
                      }}
                      key={item.name}
                    >
                      <span className="mr-[.12rem] dark:text-linkDark/50">
                        {item.name}
                      </span>
                      <Icomoon icon="share" size=".12rem" />
                    </div>
                  )
                )}
              </div>

              {lsdTokenContract && (
                <div className="mt-[.16rem] bg-color-bg3 rounded-[.12rem] py-[.16rem] px-[.24rem] text-[.14rem]">
                  <div className="text-color-text1 font-[700]">
                    {getLsdTokenName()} Token Contract Address
                  </div>

                  <div
                    className="cursor-pointer mt-[.12rem] text-color-link flex items-center"
                    onClick={() => {
                      openLink(getExplorerAccountUrl(lsdTokenContract));
                    }}
                  >
                    <span className="mr-[.12rem] flex-1 break-all leading-normal dark:text-linkDark/50">
                      {lsdTokenContract}
                    </span>

                    <div className="min-w-[.12rem]">
                      <Icomoon icon="share" size=".12rem" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {getFaqList().length > 0 && (
          <div className={classNames("mr-[.56rem] pb-[.56rem]")}>
            <div className="mt-[.16rem] text-[.24rem] text-color-text1">
              FAQ
            </div>

            <div
              className="grid items-start mt-[.16rem]"
              style={{
                gridTemplateColumns: "48% 48%",
                columnGap: "4%",
                rowGap: ".16rem",
              }}
            >
              {getFaqList().map((item: IFaqItem, index: number) => (
                <FaqItem text={item.title} key={index}>
                  {renderFaqContents(item.contents)}
                </FaqItem>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenPage;
