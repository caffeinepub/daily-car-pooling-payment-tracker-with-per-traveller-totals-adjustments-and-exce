import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";

export function useActor() {
  return _useActor(createActor);
}
