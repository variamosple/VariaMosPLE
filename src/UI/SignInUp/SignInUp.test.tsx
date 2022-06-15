import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom/extend-expect';
import ProjectService from "../../Application/Project/ProjectService";
import SignInUp from "./SignInUp";

//The SignInUp component is not used anywhere else
describe('The SignInUp component should be rendered', ()=>{
  test('The SignInUp component should be visible', ()=>{
    render(<SignInUp/>);
    expect(screen.getByText('test mxgraph')).toBeVisible()
  })
})
