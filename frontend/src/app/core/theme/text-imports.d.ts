// Hojas de estilo importadas como texto (`with { loader: 'text' }`) en los tests.
declare module '*.css' {
  const content: string;
  export default content;
}
