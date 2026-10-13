// A small syntax highlighter for the lab's editors. It only colors text — the pieces always join back into
// exactly the code that was typed, so the colored layer lines up perfectly under the real text box.
const jsKeywords = new Set('const let var function return if else for while do of in await async new class extends try catch finally throw typeof instanceof true false null undefined this break continue switch case default yield delete void'.split(' '));
const sqlKeywords = new Set('select distinct from where and or not like in is null group order by asc desc limit as count true false'.split(' '));

const patterns = {
  js: /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?|`(?:[^`\\]|\\[\s\S])*`?)|(\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?n?\b)|([A-Za-z_$][\w$]*)|(\s+)|([\s\S])/g,
  sql: /(--[^\n]*)|('(?:[^']|'')*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([\s\S])/g,
};

export function highlight(code, language) {
  const pieces = [];
  const add = (type, text) => {
    const last = pieces[pieces.length - 1];
    if (last && last.type === type) last.text += text;
    else pieces.push({ type, text });
  };
  const pattern = new RegExp(patterns[language].source, 'g');
  let match;
  while ((match = pattern.exec(code))) {
    const [text, comment, string, number, word] = match;
    if (comment) add('comment', text);
    else if (string) add('string', text);
    else if (number) add('number', text);
    else if (word) {
      const keyword = language === 'sql' ? sqlKeywords.has(word.toLowerCase()) : jsKeywords.has(word);
      add(keyword ? 'keyword' : language === 'js' && code[pattern.lastIndex] === '(' ? 'function' : 'plain', text);
    } else add('plain', text);
  }
  return pieces;
}
