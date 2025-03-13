import {
  Footer,
  Header,
  MenuContextProvider,
} from "@variamosple/variamos-components";
import VariaMosLogo from "../../../Addons/images/VariaMosLogo.png";
import { requestMenuConfig } from "../../../DataProvider/Services/configService";

import { Config } from "../../../Config";

function Layout({ children }) {
  return (
    <div className="d-flex flex-column vh-100 overflow-hidden">
      <MenuContextProvider requestMenu={requestMenuConfig}>
        <Header
          logoUrl={VariaMosLogo}
          logoAlt="VariaMos logo"
          signInUrl={Config.LOGIN_URL}
        />
      </MenuContextProvider>

      <div className="bodyContent flex-grow-1 overflow-hidden">{children}</div>

      <Footer />
    </div>
  );
}

export default Layout;
