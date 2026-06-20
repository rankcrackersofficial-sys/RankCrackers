export function parseJSON(
  text: string,
) {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.log(
      'JSON PARSE ERROR',
    );
    return null;
  }
}
