import { useEffect, useState } from "react";
import { SignUpKeys } from "../../../UI/SignUp/SignUp.constants";

export default function LanguagePage() {
  const [languageUrl, setLanguageUrl] = useState("");

  useEffect(() => {
    const currentUserProfileParam = btoa(localStorage.getItem(SignUpKeys.CurrentUserProfile));
    const databaseUserProfileParam = btoa(localStorage.getItem(SignUpKeys.DataBaseUserProfile));
    setLanguageUrl(`${process.env.REACT_APP_URLVARIAMOSLANGUAGES}?${SignUpKeys.CurrentUserProfile}=${currentUserProfileParam}&${SignUpKeys.DataBaseUserProfile}=${databaseUserProfileParam}`)
  }, []);

  return (
    <iframe
      src={languageUrl}
      title="Languages Page"
      width="100%"
      height="100%"
      style={{ position: "absolute" }}
    />
  );
}
