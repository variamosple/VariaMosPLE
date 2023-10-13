import { useState } from "react";
import { Form, FormControl, ListGroup } from "react-bootstrap";

export default function AutocompleteUserSearch({ users }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleChange = (event) => {
    const query = event.target.value;
    setQuery(query);

    const filteredUsers = users.filter((user) => {
      if (!query.toLowerCase()) {
        return false;
      }
      return user.name.toLowerCase().includes(query.toLowerCase());
    });

    setResults(filteredUsers);
  };

  return (
    <Form className="mt-3">
      <FormControl
        type="text"
        placeholder="Search for reviewers"
        value={query}
        onChange={handleChange}
      />
      <ListGroup>
        {results.map((user) => (
          <ListGroup.Item key={user.id}>{user.name}</ListGroup.Item>
        ))}
      </ListGroup>
    </Form>
  );
}
