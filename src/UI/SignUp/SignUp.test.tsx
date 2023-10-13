import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import SignInUp from "./SignUp";
import { SignUpMessages } from "./SignUp.constants";

//The SignInUp component is not used anywhere else
describe('The SignInUp component should be rendered', () => {
  test('The SignInUp component should be visible', () => {
    render(<SignInUp />);
    expect(screen.getByText(SignUpMessages.Welcome)).toBeVisible()
    expect(screen.getByText(SignUpMessages.ContinueAsGuest)).toBeVisible()
    expect(screen.getByText(SignUpMessages.SignUpWithGoogle)).toBeVisible()
  })
})
