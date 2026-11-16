const RUBY = /(\p{Script=Han}+)\{([^{}]+)\}/gu;

export const toKana = (text: string): string => text.replace(RUBY, "$2");

export const toBase = (text: string): string => text.replace(RUBY, "$1");

export const toRubyNodes = (text: string): (Node | string)[] => {
  const nodes: (Node | string)[] = [];
  let last = 0;
  for (const match of text.matchAll(RUBY)) {
    const [whole, base = "", reading = ""] = match;
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const ruby = document.createElement("ruby");
    const rt = document.createElement("rt");
    rt.textContent = reading;
    ruby.append(base, rt);
    nodes.push(ruby);
    last = match.index + whole.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};
