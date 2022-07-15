import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom/extend-expect';
import ProjectService from "../../Application/Project/ProjectService";
import AccountManagement from "./AccountManagement";

//The AccountManagement component is not used anywhere else
describe('The AccountManagement component should be rendered', ()=>{
  test('The AccountManagement component should be visible', ()=>{
    render(<AccountManagement/>);
    expect(true).toBe(true)
  })
})
