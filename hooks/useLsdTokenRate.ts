import { useEffect } from "react";
import { updateLsdTokenRate } from "redux/reducers/LsdTokenSlice";
import { RootState } from "redux/store";
import { useAppDispatch, useAppSelector } from "./common";
import { useAppSlice } from "./selector";

export function useLsdTokenRate() {
  const dispatch = useAppDispatch();
  const { updateFlag } = useAppSlice();

  const lsdTokenRate = useAppSelector((state: RootState) => {
    return state.lsdToken.rate;
  });

  useEffect(() => {
    dispatch(updateLsdTokenRate());
  }, [dispatch, lsdTokenRate, updateFlag]);

  return lsdTokenRate;
}
