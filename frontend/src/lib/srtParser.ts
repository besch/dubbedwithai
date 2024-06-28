export interface SrtObject {
  index?: string;
  timestamp?: string;
  start?: string;
  end?: string;
  text: string;
}

export default function srtToObject(srtData: string): SrtObject[] {
  const a: SrtObject[] = [];
  // Remove any surrounding quotes and unescape the string
  const unescapedSrtData = JSON.parse(
    '"' + srtData.replace(/^"|"$/g, "") + '"'
  );
  const normalizedSrtData = unescapedSrtData.replace(/\r\n|\r|\n/g, "\n");
  const lines = normalizedSrtData.split("\n");
  const len = lines.length;
  let o: SrtObject = { text: "" };

  for (let i = 0; i < len; i++) {
    const line = lines[i].trim();
    let times;

    if (/^\d+$/.test(line) && (i === 0 || lines[i - 1] === "")) {
      if (o.index) {
        a.push(o);
        o = { text: "" };
      }
      o.index = line;
    } else if (line.indexOf(" --> ") > -1) {
      o.timestamp = line;
      times = line.split(" --> ");
      o.start = times[0];
      o.end = times[1];
    } else if (line !== "") {
      o.text += (o.text ? "\n" : "") + line;
    }
  }

  // Push the last subtitle object if it's complete
  if (o.index) {
    a.push(o);
  }

  return a;
}
