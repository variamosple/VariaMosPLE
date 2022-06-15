import '@testing-library/jest-dom/extend-expect';
import MxgraphUtils from "./MxgraphUtils";

beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.123456789);
    jest.useFakeTimers('modern');
    jest.setSystemTime(1655108206699);
});

afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
    jest.useRealTimers();
})


describe('Testing deleteSelection', function () {
    test('Testing deleteSelection',()=>{

    })
})

describe('Testing findVerticeById', function () {
    test('Testing findVerticeById',()=>{

    })
})

describe('Testing findEdgeById', function () {
    test('Testing findEdgeById',()=>{

    })
})
