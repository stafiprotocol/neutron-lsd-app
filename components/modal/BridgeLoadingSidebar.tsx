import classNames from "classnames";
import { Icomoon } from "components/icon/Icomoon";
import { useAppDispatch, useAppSelector } from "hooks/common";
import Image from "next/image";
import checkFileError from "public/images/tx_error.png";
import checkFileSuccess from "public/images/tx_success.png";
import loading from "public/images/loading.png";
import {
  setBridgeLoadingParams,
  updateStakeLoadingParams,
} from "redux/reducers/AppSlice";
import { RootState } from "redux/store";
import commonStyles from "styles/Common.module.scss";

export const BridgeLoadingSidebar = () => {
  const dispatch = useAppDispatch();
  const { bridgeLoadingParams, darkMode } = useAppSelector(
    (state) => state.app
  );

  return (
    <div
      className={classNames(
        "mt-[.2rem] rounded-l-[.16rem] h-[.7rem] w-[1.9rem] flex items-center cursor-pointer border-solid border-[0.01rem] border-color-border1",
        {
          hidden:
            bridgeLoadingParams?.modalVisible === true || !bridgeLoadingParams,
        }
      )}
      style={{
        backgroundColor: darkMode ? "#222C3C" : "#ffffff80",
        backdropFilter: "blur(.13rem)",
        zIndex: 2000,
      }}
      onClick={() => {
        dispatch(setBridgeLoadingParams({ modalVisible: true }));
      }}
    >
      <div
        className={classNames(
          "ml-[.16rem] relative w-[.32rem] h-[.32rem]",
          bridgeLoadingParams?.status === "loading" ? commonStyles.loading : ""
        )}
      >
        <Image
          src={
            bridgeLoadingParams?.status === "success"
              ? checkFileSuccess
              : bridgeLoadingParams?.status === "error"
              ? checkFileError
              : loading
          }
          layout="fill"
          alt="loading"
        />
      </div>

      <div
        className={classNames(
          "ml-[.16rem] text-[.16rem] leading-normal",
          bridgeLoadingParams?.status === "success"
            ? "text-color-text1"
            : bridgeLoadingParams?.status === "error"
            ? "text-error"
            : "text-color-text2"
        )}
      >
        Swap
        <br />
        {bridgeLoadingParams?.status === "success"
          ? "Succeed"
          : bridgeLoadingParams?.status === "error"
          ? "Failed"
          : "Operating"}
      </div>

      <div className="ml-[.2rem] rotate-90">
        <Icomoon icon="right" color="#6C86AD" size=".16rem" />
      </div>
    </div>
  );
};
