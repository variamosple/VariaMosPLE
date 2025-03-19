import { Menu, ResponseModel } from "@variamosple/variamos-components";
import axios from "axios";
import { ADMIN_CLIENT } from "../../Infraestructure/AxiosConfig";

export const requestMenuConfig = (): Promise<ResponseModel<Menu>> => {
  return ADMIN_CLIENT.get(`/v1/configurations/menu`)
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
          `Error when trying to query menu config, please try again later.`
        );
      }
    });
};
