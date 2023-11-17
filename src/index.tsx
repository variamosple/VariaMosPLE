import React from "react";
import ReactDOM from "react-dom";
import SignInUp from "./UI/SignUp/SignUp";
import DashBoard from "./UI/WorkSpace/DashBoard";
import LanguagePage from "./core/pages/LanguagesPage";
import { BrowserRouter, Routes, Route } from "react-router-dom"; 
 
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route index element={<SignInUp />} />
          <Route path="dashboard" element={<DashBoard loginEnabled={true}/>} />
          <Route path="languages" element={<LanguagePage/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.render(<App/>, document.getElementById("root"));
