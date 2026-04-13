import {
  buildServerDoctorReport,
  buildWalletDoctorReport,
  summarizeDoctorChecks,
} from "./doctor";
import {
  buildBaseSameChainDepositPreset,
  buildQuoteFlowPresets,
  defaultAmount,
  getDefaultFlowPreset,
  resolvePrimaryUnderlyingToken,
} from "./presets";
import { buildComposerQuoteInput, getApprovalRequirement } from "./quote";
import {
  buildDebugBundle,
  buildShareableDebugSnapshot,
  getQuoteTools,
  getRouteStages,
} from "./route-debug";

export function createEarnToolkitClient() {
  return {
    resolvePrimaryUnderlyingToken,
    defaultAmount,
    buildBaseSameChainDepositPreset,
    buildQuoteFlowPresets,
    getDefaultFlowPreset,
    buildComposerQuoteInput,
    getApprovalRequirement,
    getQuoteTools,
    getRouteStages,
    buildDebugBundle,
    buildShareableDebugSnapshot,
    buildServerDoctorReport,
    buildWalletDoctorReport,
    summarizeDoctorChecks,
  };
}

export const earnToolkitClient = createEarnToolkitClient();
