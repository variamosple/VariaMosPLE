
// We really should be able to synchronize the query class
// with the semantic translator definition,
// but this will do for now.
export class Query {
    operation: string;
    solver: string;
    operation_n?: number;
    iterate_over?: object;
    optimization_target?: string;
    optimization_direction?: string;

    constructor(
        { operation,
            solver,
            operation_n,
            iterate_over,
            optimization_target,
            optimization_direction
        }: {
            operation: string,
            solver: string,
            operation_n?: number,
            iterate_over?: object,
            optimization_target?: string,
            optimization_direction?: string
        }
    ) {
        this.operation = operation;
        this.solver = solver;
        this.operation_n = operation_n;
        this.iterate_over = iterate_over;
        this.optimization_target = optimization_target;
        this.optimization_direction = optimization_direction;
    }
}