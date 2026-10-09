// Emoji are decoration on this site (the words next to them carry the meaning), so screen readers should skip them.
// Wraps every emoji found in page text in <span aria-hidden="true">, leaving attributes and scripts alone.
const EMOJI = /((?![©®™☰])\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*)/gu;
const SKIP = /<(script|style|textarea)\b[\s\S]*?<\/\1>/gi;

export function hideDecorativeEmoji(html) {
  const kept = [];
  const guarded = html.replace(SKIP, (block) => {
    kept.push(block);
    return `@@KEEP${kept.length - 1}@@`;
  });

  // Text nodes only: the characters after a tag and before the next one. Text already inside an
  // aria-hidden element is left as it is.
  const wrapped = guarded.replace(/(<[^<>]*>)([^<>]+)(?=<)/g, (match, tag, text) => {
    EMOJI.lastIndex = 0;
    if (!EMOJI.test(text) || /aria-hidden="true"/.test(tag)) return match;
    EMOJI.lastIndex = 0;
    return `${tag}${text.replace(EMOJI, '<span aria-hidden="true">$1</span>')}`;
  });

  return wrapped.replace(/@@KEEP(\d+)@@/g, (match, index) => kept[Number(index)]);
}
