import QueryResultOld from "../Queries/queryResult";

interface QueryResultsProps {
    projectService: any;
    results: any[];
    onVisualize?: () => void;
}

function QueryResults({ projectService, results, onVisualize }: Readonly<QueryResultsProps>): JSX.Element {
    return <div className="QueryResults">
        {results.map((result: any, index: any) => (
            <QueryResultOld
                key={`${index}-${JSON.stringify(result)}`}
                index={index}
                result={result}
                projectService={projectService}
                onVisualize={onVisualize}
            />
        ))}
    </div>
}

export default QueryResults;