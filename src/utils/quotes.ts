import quotes from './quotes.json'

interface Quote {
  paragraph: string;
  author: string;
  cite: string;
  citeURI: string;
}

export const getRandomQuote = () => quotes[quotes.length * Math.random() | 0] as Quote

export const renderQuote = () => {
  const {paragraph, author, cite, citeURI} = getRandomQuote()
  return `
  <figure>
    <blockquote cite="${citeURI}">
        <p>${paragraph}</p>
    </blockquote>
    <figcaption><i>—${author} <cite>${cite}</cite></i></figcaption>
  </figure>
  `
}