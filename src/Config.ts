export const Config = {
  VERSION: "4.25.05.09.07",
  NODE_ENV: process.env.REACT_APP_NODE_ENV || "development",
  HOST: process.env.REACT_APP_HOST || "127.0.0.1",
  PORT: process.env.REACT_APP_PORT || 3000,
  SERVICES: {
    urlBackEndAdmin: process.env.REACT_APP_VARIAMOS_ADMIN_API_URL,
    urlBackEndLanguage: process.env.REACT_APP_URLBACKENDLANGUAGE,
    urlBackEndProjectPersistence: process.env.REACT_APP_URLVMSPROJECTS,
    urlBackEndRestriction: process.env.REACT_APP_URLBACKENDRESTRICTION,
    urlVariamosDocumentation: process.env.REACT_APP_URLVARIAMOSDOCUMENTATION,
    urlVariamosLanguages: process.env.REACT_APP_URLVARIAMOSLANGUAGES,
    urlVariamosLangDocumentation:
      process.env.REACT_APP_URLVARIAMOSLANGDOCUMENTATION,
  },
  LOGIN_URL: process.env.REACT_APP_VARIAMOS_LOGIN_URL || "",
};
