import {SignUpKeys } from "./SignUp.constants";

export function logoutUser() {
  sessionStorage.clear();
  window.location.href = '/';
  return true;
}

export function getUserProfile() {
  return JSON.parse(sessionStorage.getItem(SignUpKeys.CurrentUserProfile))
}

export function getDataBaseUserProfile() {
  return JSON.parse(sessionStorage.getItem(SignUpKeys.DataBaseUserProfile))
}
