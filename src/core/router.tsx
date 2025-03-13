import { Navigate, RouteObject } from "react-router-dom";

import { AuthWrapper } from "@variamosple/variamos-components";
import { Config } from "../Config";
import DashBoard from "../UI/WorkSpace/DashBoard";

export const ROUTES: RouteObject[] = [
  {
    path: "/",
    children: [
      {
        index: true,
        element: (
          <AuthWrapper redirectPath={Config.LOGIN_URL}>
            <DashBoard />
          </AuthWrapper>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];
