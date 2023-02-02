import React from "react";
import axios from "axios";
import { GoogleLogin } from "react-google-login";
import VariaMosLogo from "../../Addons/images/VariaMosLogo.png";
import _config from "../../Infraestructure/config.json";
import './SignUp.css';
import { SignUpKeys, SignUpMessages, SignUpURLs, SignUpUserTypes } from "./SignUp.constants";

/**
 * Controls the redirect action after Google's login.
 * 
 * @param response contains the user data if login successful.
 */
const responseGoogle = (response) => {
  const userProfile = {...response.profileObj, userType: SignUpUserTypes.Registered };
  sessionStorage.setItem(SignUpKeys.CurrentUserProfile, JSON.stringify(userProfile))

  axios.post(`${_config.urlBackEndLanguage}${SignUpURLs.SignIn}`, {
    email: userProfile.email,
    name: userProfile.givenName
  }).then((data) => {
    console.log(data);
  })

  if (response && response.accessToken) {
    window.location.href = SignUpURLs.Dashboard;
  } 
};

const signUpAsAGuestHandler = () => {
  const guestProfile = { email: null, givenName: 'Guest', userType: SignUpUserTypes.Guest }
  sessionStorage.setItem(SignUpKeys.CurrentUserProfile, JSON.stringify(guestProfile))
  window.location.href = SignUpURLs.Dashboard;
}

function SignInUp() {
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
          <h3 className="signup__title text-center projectName p-2">{SignUpMessages.Welcome}</h3>
          <div>
            <GoogleLogin
              clientId="89157287881-nmvv2flktr85loou6tr5ae2cfggo6tl7.apps.googleusercontent.com"
              buttonText={SignUpMessages.SignUpWithGoogle}
              onSuccess={responseGoogle}
              onFailure={responseGoogle}
            />
          </div>
          <div className="signup__guest">
            <a href="#" onClick={signUpAsAGuestHandler} className="signup__guest-link">{SignUpMessages.ContinueAsGuest}</a>
          </div>
        </div>
    </div>
  );
}

export default SignInUp;
