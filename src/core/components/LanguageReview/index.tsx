import { Button, Image, ListGroup } from "react-bootstrap";
import AutocompleteUserSearch from "./AutocompleteUserSearch";
import { useEffect, useState } from "react";

export default function LanguageReview() {
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hasReview, setReview] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setUsers([
      {
        id: 1,
        name: "John Doe",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      },
      {
        id: 2,
        name: "Jane Smith",
        avatar: "https://randomuser.me/api/portraits/women/2.jpg",
      },
      {
        id: 3,
        name: "Bob Johnson",
        avatar: "https://randomuser.me/api/portraits/men/3.jpg",
      },
      {
        id: 4,
        name: "Alice Williams",
        avatar: "https://randomuser.me/api/portraits/women/4.jpg",
      },
    ]);
  }, []);

  return hasReview ? (
    <>
      <AutocompleteUserSearch users={users} />
      <p className="mt-3">Reviewers:</p>
      <ListGroup className="mt-2">
        {users.slice(1, users.length).map((user, index) => (
          <ListGroup.Item key={index}>
            <Image
              width={48}
              thumbnail
              src={user.avatar}
              roundedCircle
              className="mb-2"
            />{" "}
            <span>{user.name}</span>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <p className="mt-3">Owner:</p>
      <ListGroup className="mt-2">
        <ListGroup.Item>
          <Image
            width={48}
            thumbnail
            src={users[0].avatar}
            roundedCircle
            className="mb-2"
          />{" "}
          <span>{users[0].name}</span>
        </ListGroup.Item>
      </ListGroup>
    </>
  ) : (
    <Button className="mb-3 mt-3" variant="primary" disabled={true}>
      Start a new review
    </Button>
  );
}
