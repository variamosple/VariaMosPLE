import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faFolderOpen } from '@fortawesome/free-regular-svg-icons'
import SwitchSelector from "react-switch-selector";

interface QueryNavbarProps {
  setQueryMode: (mode: string) => void;
  setQueryName: (name: string) => void;
  queryName: string;
  handleSaveQuery: () => void;
  handleLoadQuery: () => void;
}

function QueryNavbar({ setQueryMode, setQueryName, queryName, handleSaveQuery, handleLoadQuery }: Readonly<QueryNavbarProps>): JSX.Element {
  return (
    <div className="navbar">
      <div id="query-mode-selector">
        <SwitchSelector
          onChange={(value) => setQueryMode(value as string)}
          options={[
            {
              label: "Write",
              value: "write",
              selectedBackgroundColor: "#000000",
            },
            {
              label: "Build",
              value: "build",
              selectedBackgroundColor: "#000000",
            },
          ]}
          initialSelectedIndex={0}
          name="queryMode"
        />
      </div>
      <input id="save-query-input" type="text" placeholder="Query name..." value={queryName} onChange={(e) => setQueryName(e.target.value)} />
      <button className="icon-btn" title="Save query" onClick={handleSaveQuery}>
        <FontAwesomeIcon icon={faFloppyDisk} />
      </button>
      <button className="icon-btn" title="Load query" onClick={handleLoadQuery}>
        <FontAwesomeIcon icon={faFolderOpen} />
      </button>
    </div>
  )
}

export default QueryNavbar