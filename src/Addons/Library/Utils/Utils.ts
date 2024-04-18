export class Utils {
  downloadFile(filename: any, file: any) {
    var dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(file));
    var downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
  
  downloadBinaryFile(filename: any, bytes: any) {
    var blob = new Blob([bytes]);
    var downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", window.URL.createObjectURL(blob));
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove(); 
  }

  generateId(): string {
    var dt = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
    return uuid;
  }
}

//src: https://gist.github.com/codeguy/6684588
export const slugify = (...args: (string | number)[]): string => {
  const value = args.join(' ')

  return value
      .normalize('NFD') // split an accented letter in the base letter and the acent
      .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
      .toUpperCase() // make it all upper case
      .trim()
      .replace(/[^A-Z0-9 ]/g, '') // remove all chars not letters, numbers and spaces (to be replaced)
      .replace(/\s+/g, '_') // separator
}