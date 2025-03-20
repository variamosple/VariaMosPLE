import {
  ResponseModel,
  SessionInfoResponse,
} from "@variamosple/variamos-components";
import axios from "axios";
import { ADMIN_CLIENT } from "../../Infraestructure/AxiosConfig";

export const getSessionInfo = (): Promise<
  ResponseModel<SessionInfoResponse>
> => {
  return ADMIN_CLIENT.get("/auth/session-info", {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  })
    .then((response) => response.data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Error when comunicating with the back-end."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to get session info, please try again later."
        );
      }
    });
};

export const requestLogout = (): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.post("/auth/logout")
    .then(() => {})
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);

        const response = error.response?.data;

        if (!!response) {
          return response;
        }

        return new ResponseModel("BACK-ERROR").withError(
          Number.parseInt(error.code || "500"),
          "Error when comunicating with the back-end."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying to logout, please try again later."
        );
      }
    });
};
