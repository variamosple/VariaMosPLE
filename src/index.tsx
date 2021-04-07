import React from 'react';
import ReactDOM from 'react-dom';
import ProjectManagement from './UI/ProjectManagement/ProjectManagement';
import DashBoard from './UI/WorkSpace/DashBoard';

ReactDOM.render(
  <React.StrictMode>
    <ProjectManagement />
    <DashBoard />
  </React.StrictMode>,
  document.getElementById('root')
);

