import { hasSemantics } from "../../Domain/ProductLineEngineering/UseCases/QueryUseCases";
import QueryBuilderOld from "../Queries/queryBuilder";
import ProjectService from "../../Application/Project/ProjectService";

interface QueryBuilderProps {
    projectService: ProjectService;
    setQuery: React.Dispatch<React.SetStateAction<string>>;
}

function QueryBuilder({projectService, setQuery}: Readonly<QueryBuilderProps>): JSX.Element {
    return <div id="query-builder">
        {hasSemantics(projectService) ? (
            <QueryBuilderOld
                projectService={projectService}
                setQuery={setQuery}
                setKey={() => {}}
            />
        ) : (
            <p className="my-2">
            There are no semantics for the current language
            </p>
        )}
    </div>
}

export default QueryBuilder;