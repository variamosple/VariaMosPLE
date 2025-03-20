import {
  AnalyticsProvider,
  SessionProvider,
} from "@variamosple/variamos-components";
import { FC } from "react";
import { HashRouter, useRoutes } from "react-router-dom";
import { Config } from "./Config";
import { RouterProvider } from "./core/context/RouterContext/RouterContext";
import { ROUTES } from "./core/router";
import {
  getSessionInfo,
  requestLogout,
} from "./DataProvider/Services/authService";
import { registerVisit } from "./DataProvider/Services/visitsService";

const Routes: FC = () => {
  return useRoutes(ROUTES);
};

const App: FC = () => {
  return (
    <AnalyticsProvider onVisit={registerVisit}>
      <SessionProvider
        loginUrl={Config.LOGIN_URL}
        getSessionInfo={getSessionInfo}
        requestLogout={requestLogout}
      >
        <HashRouter>
          <RouterProvider>
            <Routes />
          </RouterProvider>
        </HashRouter>
      </SessionProvider>
    </AnalyticsProvider>
  );
};

export default App;
