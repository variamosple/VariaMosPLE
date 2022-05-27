import {Utils} from "./Utils";

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
    console.log("geenerated_id",generated_id);
    expect(generated_id).not.toBe(basic_id);
});

test('The file is downloaded', () => {
    let util_class = new Utils();
    let filename = "myFile";
    var file = new File(["foo"], "foo.txt", {
        type: "text/plain",
    });
    util_class.downloadFile(filename, file);
});
