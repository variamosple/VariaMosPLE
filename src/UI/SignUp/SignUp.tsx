import React, { useEffect, useState } from "react";
import axios from "axios";
import { GoogleLogin, GoogleLogout } from "react-google-login";
import VariaMosLogo from "../../Addons/images/VariaMosLogo.png";
import './SignUp.css';
import { SignUpKeys, SignUpMessages, SignUpURLs, SignUpUserTypes } from "./SignUp.constants"; 
import env from 'react-dotenv';
import { gapi } from 'gapi-script';
import { Config } from "../../Config";

function SignInUp() {
  const [loginProgress, setLoginProgress] = useState(SignUpMessages.Welcome);
  const [hasErrors, setErrors] = useState(false);
  const clientId="364413657269-7h80i7vdc1mbooitbpa9n2s719io1ts2.apps.googleusercontent.com"

  useEffect(() => {
    const isUserLoggedIn = !!sessionStorage.getItem(SignUpKeys.CurrentUserProfile)
    if (isUserLoggedIn) {
      window.location.href = SignUpURLs.Dashboard;
    }

    function start() {
      gapi.client.init({
        clientId: clientId,
        scope: 'email',
      });
    }

    gapi.load('client:auth2', start);
  }, [])

  const signUpAsAGuestHandler = () => {
    const guestProfile = { email: null, givenName: 'Guest', userType: SignUpUserTypes.Guest }
    const stringifiedGuestProfile = JSON.stringify(guestProfile)
    sessionStorage.setItem(SignUpKeys.CurrentUserProfile, stringifiedGuestProfile);
    localStorage.setItem(SignUpKeys.CurrentUserProfile, stringifiedGuestProfile); // Copying the value to LocalStorage to share it between microfrontends

    sessionStorage.removeItem(SignUpKeys.DataBaseUserProfile);
    localStorage.removeItem(SignUpKeys.DataBaseUserProfile); // Copying the value to LocalStorage to share it between microfrontends
    window.location.href = SignUpURLs.Dashboard;
  }

  const onSuccess = response => {     
    const userProfile = { ...response.profileObj, userType: SignUpUserTypes.Registered };
    const stringifiedUserProfile = JSON.stringify(userProfile);
    sessionStorage.setItem(SignUpKeys.CurrentUserProfile, stringifiedUserProfile);
    localStorage.setItem(SignUpKeys.CurrentUserProfile, stringifiedUserProfile); // Copying the value to LocalStorage to share it between microfrontends

    setLoginProgress(SignUpMessages.Loading);

    let url=`${Config.SERVICES.urlBackEndLanguage}${SignUpURLs.SignIn}`;

    axios.post(url, {
      email: userProfile.email,
      name: userProfile.givenName
    }).then(({ data: responseData }) => {
      const { data } = responseData;
      const stringifiedData = JSON.stringify(data);
      sessionStorage.setItem(SignUpKeys.DataBaseUserProfile, stringifiedData)
      localStorage.setItem(SignUpKeys.DataBaseUserProfile, stringifiedData) // Copying the value to LocalStorage to share it between microfrontends

      if (response && response.accessToken) {
        window.location.href = SignUpURLs.Dashboard;
      }
    }).catch((e) => {
      setErrors(true);
      setLoginProgress(SignUpMessages.LoginError);
    })
  };

  const onFailure = response => {
    console.log('FAILED', response);
  };

  return (
    <div className="signup">
      <div className="signup__container shadow-sm rounded">
        <img
          src={VariaMosLogo}
          alt=""
          className="img-fluid"
          width="191"
          height="39"
        />
        <h3 className={`signup__title text-center ${hasErrors ? `signup__error` : `projectName`} p-2`}>{loginProgress}</h3>
        <div>
          <GoogleLogin
            clientId={clientId}
            onSuccess={onSuccess}
            onFailure={onFailure}
          /> 
        </div>
        <div className="signup__guest">
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a href="#" onClick={signUpAsAGuestHandler} className="signup__guest-link">{SignUpMessages.ContinueAsGuest}</a>
        </div>
      </div>
    </div>
  );
}

export default SignInUp;
