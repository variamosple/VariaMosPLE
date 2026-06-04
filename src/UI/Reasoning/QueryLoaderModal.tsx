import { Button, Modal } from "react-bootstrap";

interface QueryLoaderModalProps {
    show: boolean;
    onHide: () => void;
    savedQueries: any;
    setQuery: (query: string) => void;
}

function QueryLoaderModal({show, onHide, savedQueries, setQuery}: Readonly<QueryLoaderModalProps>): JSX.Element {
    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header>
                <Modal.Title>Load Query</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {(Object.getOwnPropertyNames(savedQueries).length > 0 &&
                    Object.entries(savedQueries).map(([name, query], index) => (
                        query && <div key={index}>
                        <Button
                            variant="primary"
                            onClick={() => {
                                setQuery(JSON.stringify(query));
                                onHide();
                            }}
                        >
                            {name}
                        </Button>
                        </div>
                    ))) || (
                    <div>
                        <p>No saved queries</p>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default QueryLoaderModal;