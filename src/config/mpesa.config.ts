import { mpesaEnv } from "./env";

const SANDBOX_BASE_URL = "https://sandbox.safaricom.co.ke";
const PRODUCTION_BASE_URL = "https://api.safaricom.co.ke";

function baseUrl(): string {
  return mpesaEnv.environment === "production" ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;
}

export const mpesaConfig = {
  get environment() {
    return mpesaEnv.environment;
  },
  get oauthUrl() {
    return `${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`;
  },
  get stkPushUrl() {
    return `${baseUrl()}/mpesa/stkpush/v1/processrequest`;
  },
  get stkQueryUrl() {
    return `${baseUrl()}/mpesa/stkpushquery/v1/query`;
  },
};
