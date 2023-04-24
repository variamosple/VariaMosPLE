import {Utils} from "./Utils";

beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.123456789);
    jest.useFakeTimers();
    jest.setSystemTime(1655108206699);
});

afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
    jest.useRealTimers();
})

describe('Testing generateId', function () {

    test('The generated ID has the right number of digits', () => {
        let basic_id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
        let util_class = new Utils();
        let generated_id = util_class.generateId();
        expect(generated_id.length).toBe(basic_id.length);
    });

    test('The default ID has been changed', () => {
        let basic_id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
        let util_class = new Utils();
        let generated_id = util_class.generateId();
        expect(generated_id).not.toBe(basic_id);
    });

    test('The digit 4 has not been changed', () => {
        let util_class = new Utils();
        let generated_id = util_class.generateId();
        expect(generated_id[14]).toBe("4");
    });

    test('The dashes have not been changed', () => {
        let util_class = new Utils();
        let generated_id = util_class.generateId();
        expect(generated_id[13]).toBe("-");
    });

    test('The randomizer should return the right result with mocked date "1655108206699"', () => {
        let mocked_generated_id = "c71143d6-2921-4111-9111-111111111111";
        let util_class = new Utils();
        let generated_id = util_class.generateId();
        expect(generated_id).toBe(mocked_generated_id);
    });
});


test('The file is downloaded', () => {
    let util_class = new Utils();
    let filename = "myFile";
    var mockFile = new File(["foo"], "foo.txt", {
        type: "text/plain",
    });

    util_class.downloadFile(filename, mockFile);
});
