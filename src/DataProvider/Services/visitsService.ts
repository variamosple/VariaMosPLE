import { ResponseModel } from "@variamosple/variamos-components";
import axios from "axios";
import { ADMIN_CLIENT } from "../../Infraestructure/AxiosConfig";

export const registerVisit = (pageId: string): Promise<ResponseModel<void>> => {
  return ADMIN_CLIENT.post(`/v1/visits`, { pageId })
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
          "Network/communication error."
        );
      } else {
        console.error("Unexpected error:", error);

        return new ResponseModel("APP-ERROR").withError(
          500,
          "Error when trying register the visit, please try again later."
        );
      }
    });
};
