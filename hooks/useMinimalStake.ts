import { RootState } from "redux/store";
import { chainAmountToHuman } from "utils/numberUtils";
import { useAppSelector } from "./common";

export function useMinimalStake() {
  const minimalStake = useAppSelector((state: RootState) => {
    if (!state.token.neutronPoolInfo) {
      return "0";
    }
    return chainAmountToHuman(state.token.neutronPoolInfo.minimal_stake);
  });

  return minimalStake;
}
