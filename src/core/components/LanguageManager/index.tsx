import axios from "axios";
import { useEffect, useState } from "react";
import { Alert, Form, ListGroup, Spinner } from "react-bootstrap";
import { CardText } from "react-bootstrap-icons";
import { Language } from "../../../Domain/ProductLineEngineering/Entities/Language";
import CreateLanguageButton from "./CreateLanguageButton/CreateLanguageButton";
import LanguageManagerLayout from "./LanguageManagerLayout/LanguageManagerLayout";
import { getServiceUrl } from "./index.utils";
import { LanguageManagerProps } from "./index.types";

const sortAphabetically = (a, b) => {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
};

export default function LanguageManager({
  setLanguage,
  setCreatingLanguage,
  requestLanguages,
  setRequestLanguages,
}: LanguageManagerProps) {
  const [showSpinner, setShowSpinner] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [displayedLanguages, setDisplayedLanguages] = useState<Language[]>([]);
  const handleCreateClick = () => {
    setCreatingLanguage(true);
  };

  useEffect(() => {
    setShowSpinner(true);
    setDisplayedLanguages([])
    axios
      .get(getServiceUrl("languages", "detail"))
      .then(({ data: { data } }) => {
        const sortedLanguages = data.sort(sortAphabetically)
        setLanguages(sortedLanguages);
        setDisplayedLanguages(sortedLanguages);
        setShowSpinner(false);
        setRequestLanguages(false);
      });
  }, [requestLanguages, setRequestLanguages]);

  const handleClick = (language) => () => {
    setLanguage(language);
    setCreatingLanguage(false);
  };

  const handleSearchChange = (event) => {
    const searchTerm = event.target.value;

    const filteredLanguages = languages.filter((language) => {
      return language.name
        .toLocaleLowerCase()
        .includes(searchTerm.toLocaleLowerCase());
    });

    setDisplayedLanguages(filteredLanguages);
  };

  return (
    <LanguageManagerLayout>
      <CreateLanguageButton handleCreateClick={handleCreateClick} />
      <Form.Group controlId="searchLanguages">
        <Form.Control
          type="text"
          placeholder="Find a language..."
          onChange={handleSearchChange}
        />
      </Form.Group>
      <ListGroup style={{ minWidth: "312px", marginBottom: "10px" }}>
        {showSpinner && (
          <Spinner
            animation="border"
            role="status"
            variant="primary"
            className="mb-3"
          >
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        )}
        {!!displayedLanguages.length ? (
          displayedLanguages.map((language, index) => (
            <ListGroup.Item action key={index} onClick={handleClick(language)}>
              <CardText style={{ marginRight: "10px" }} />
              {language.name}
            </ListGroup.Item>
          ))
        ) : (
          <NoResultsAvailableAlert showSpinner={showSpinner} />
        )}
      </ListGroup>
    </LanguageManagerLayout>
  );
}

function NoResultsAvailableAlert({ showSpinner }: { showSpinner: boolean }) {
  return !showSpinner && <Alert variant="info">No results available</Alert>;
}
