import {render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import DashBoard from "./DashBoard";

describe('On initial render, the dashboard should contains the required elements', ()=>{
  test('The TreeMenu should be visible', ()=>{
    render(<DashBoard />);
    expect(screen.getByRole('img')).toBeVisible();
  });

  test('The ProjectManagement panel should be visible', ()=>{
    render(<DashBoard />);
    expect(screen.getByRole('heading', {name: /project management/i})).toBeVisible()
  });

  test('The NavBar should be visible', ()=>{
    render(<DashBoard />);
    expect(screen.getByRole('listitem', {name: /home/i})).toBeVisible()
  });

  test('The DiagramEditor should be visible', ()=>{
    render(<DashBoard />);
    expect(document.querySelector('#EditorPannel > div > div > div')).toBeVisible()
  });

  test('The ElementsPannel should be visible', ()=>{
    render(<DashBoard />);
    expect(screen.getByText(/elements/i)).toBeVisible()
  });

  test('The PropiertiesPannel should be visible', ()=>{
    render(<DashBoard />);
    expect(screen.getByText(/propierties/i)).toBeVisible()
  });

})

