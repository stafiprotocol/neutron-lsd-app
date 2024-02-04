import { Tooltip } from "@mui/material";
import classNames from "classnames";
import { CircularLoading } from "components/common/CircularLoading";
import { Icomoon } from "components/icon/Icomoon";
import { getExplorerTxUrl } from "config/explorer";
import { LoadingProgressDetailItem } from "redux/reducers/AppSlice";
import { getShortAddress } from "utils/stringUtils";

interface RedelegateLoadingProgressItemProps {
  stepIndex: number;
  name: "TokenizeShares" | "Sending" | "Minting";
  data: LoadingProgressDetailItem | undefined;
  chainId: string | undefined;
  txHash?: string | undefined;
  scanUrl?: string | undefined;
}

export const RedelegateLoadingProgressItem = (
  props: RedelegateLoadingProgressItemProps
) => {
  const { data, name, txHash, scanUrl, chainId } = props;

  const getTxUrl = () => {
    return getExplorerTxUrl(txHash, chainId);
  };

  return (
    <div className="pb-[.2rem] pl-[.56rem]">
      <div className="flex items-center">
        <div
          className={classNames(
            "rounded-full w-[.24rem] h-[.24rem] flex items-center justify-center text-[.1rem] font-bold  border-solid border-[1px] border-color-text2",
            data?.totalStatus === "success"
              ? "bg-link text-white"
              : "rounded-full text-color-text2"
          )}
          style={
            {
              // border:
              //   data.totalStatus === "success"
              //     ? "0.5px solid #0095EB"
              //     : "0.5px solid #9DAFBE",
              // color: data.totalStatus === "success" ? "#0095EB" : "#9DAFBE",
            }
          }
        >
          {props.stepIndex + 1}
        </div>
        <div
          className={classNames(
            "text-[.16rem] font-[700] ml-[.08rem]",
            data?.totalStatus === "success"
              ? "text-color-link"
              : "text-color-text2"
          )}
        >
          {name}
        </div>

        {data?.totalStatus === "success" ? (
          <div className="ml-[.26rem]">
            <Icomoon icon="nike" size=".2rem" color="#5A5DE0" />
          </div>
        ) : data?.totalStatus === "error" ? (
          <div className="ml-[.26rem]">
            <Icomoon icon="error" size=".2rem" color="#FF52C4" />
          </div>
        ) : data?.totalStatus === "loading" ? (
          <div className="ml-[.26rem]">
            <CircularLoading color="primary" size=".16rem" />
          </div>
        ) : (
          <></>
        )}
      </div>

      <div className={classNames("ml-[.2rem] mt-[.12rem]  text-[.14rem]")}>
        <div
          className={classNames(
            "flex items-center",
            {
              hidden: props.name === "Minting",
            },
            data?.totalStatus === "success"
              ? "text-color-link"
              : data?.totalStatus === "error"
              ? "text-error"
              : "text-color-text2"
          )}
        >
          <div className="mr-[.1rem]">Broadcasting...</div>

          {data?.totalStatus === "success" && (
            <Icomoon icon="nike" size=".14rem" color="#5A5DE0" />
          )}
        </div>
        <div
          className={classNames(
            "mt-[.08rem] flex items-center",
            {
              hidden: props.name === "Minting",
            },
            data?.totalStatus === "success"
              ? "text-color-link"
              : data?.totalStatus === "error"
              ? "text-error"
              : "text-color-text2"
          )}
        >
          <div className="mr-[.1rem]">Packing...</div>

          {data?.totalStatus === "success" && (
            <Icomoon icon="nike" size=".14rem" color="#5A5DE0" />
          )}
        </div>

        {txHash && (
          <div className="mt-[.12rem] text-color-text1">
            Check Tx{" "}
            <a
              className="underline"
              href={getTxUrl() || ""}
              target="_blank"
              rel="noreferrer"
            >
              {getShortAddress(txHash, 3)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
