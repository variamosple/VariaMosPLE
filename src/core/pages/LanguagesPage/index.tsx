import { useEffect } from "react";
import { SignUpKeys } from "../../../UI/SignUp/SignUp.constants";

export default function LanguagePage() {
  useEffect(() => {
    const currentUserProfileParam = btoa(localStorage.getItem(SignUpKeys.CurrentUserProfile));
    const databaseUserProfileParam = btoa(localStorage.getItem(SignUpKeys.DataBaseUserProfile));
    const url = `${process.env.REACT_APP_URLVARIAMOSLANGUAGES}?${SignUpKeys.CurrentUserProfile}=${currentUserProfileParam}&${SignUpKeys.DataBaseUserProfile}=${databaseUserProfileParam}`;
    window.location.href = url;
  }, []);

  return null;
}
