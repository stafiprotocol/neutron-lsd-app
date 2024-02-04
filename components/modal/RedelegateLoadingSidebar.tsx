import classNames from "classnames";
import { Icomoon } from "components/icon/Icomoon";
import { useAppDispatch, useAppSelector } from "hooks/common";
import { useAppSlice } from "hooks/selector";
import Image from "next/image";
import loading from "public/images/loading.png";
import checkFileError from "public/images/tx_error.png";
import checkFileSuccess from "public/images/tx_success.png";
import { updateRedelegateLoadingParams } from "redux/reducers/AppSlice";
import { RootState } from "redux/store";
import commonStyles from "../../styles/Common.module.scss";

export const RedelegateLoadingSidebar = () => {
  const { darkMode } = useAppSlice();
  const dispatch = useAppDispatch();
  const { redelegateLoadingParams } = useAppSelector((state: RootState) => {
    return {
      redelegateLoadingParams: state.app.redelegateLoadingParams,
    };
  });

  return (
    <div
      className={classNames(
        "mt-[.2rem] rounded-l-[.16rem] h-[.7rem] w-[1.9rem] flex items-center cursor-pointer border-solid border-[0.01rem] border-color-border1",
        {
          hidden:
            redelegateLoadingParams?.modalVisible === true ||
            !redelegateLoadingParams,
        }
      )}
      style={{
        backgroundColor: darkMode ? "#222C3C" : "#ffffff80",
        backdropFilter: "blur(.13rem)",
        zIndex: 2000,
      }}
      onClick={() => {
        dispatch(updateRedelegateLoadingParams({ modalVisible: true }));
      }}
    >
      <div
        className={classNames(
          "ml-[.16rem] relative w-[.32rem] h-[.32rem]",
          redelegateLoadingParams?.status === "loading"
            ? commonStyles.loading
            : ""
        )}
      >
        <Image
          src={
            redelegateLoadingParams?.status === "success"
              ? checkFileSuccess
              : redelegateLoadingParams?.status === "error"
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
          redelegateLoadingParams?.status === "success"
            ? "text-color-text1"
            : redelegateLoadingParams?.status === "error"
            ? "text-error"
            : "text-color-text2"
        )}
      >
        Redelegate
        <br />
        {redelegateLoadingParams?.status === "success"
          ? "Succeed"
          : redelegateLoadingParams?.status === "error"
          ? "Failed"
          : "Operating"}
      </div>

      <div className="ml-[.2rem] rotate-90">
        <Icomoon icon="right" color="#6C86AD" size=".16rem" />
      </div>
    </div>
  );
};
