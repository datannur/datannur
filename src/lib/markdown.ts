import { marked } from 'marked'
import { getBaseLinkUrl } from 'svelte-fileapp'

const renderer = new marked.Renderer()
renderer.link = ({ href, title, text }) => {
  if (!title) title = ''

  if (
    href.includes('http') ||
    href.includes('mailto') ||
    title.includes('new_tab')
  ) {
    return `<a href="${href}" target="_blank" rel="noopener" class="basic-link" title="${title}">${text}</a>`
  }

  const base = getBaseLinkUrl()
  return `<a href="${base}${href}" data-href="${href}" class="basic-link internal-link" title="${title}">${text}</a>`
}

renderer.image = function ({ href, text }) {
  if (!text) text = ''
  if (text.includes('no-caption')) {
    return `<img src="${href}" alt="${text}" />`
  }
  return `<figure>
    <img src="${href}" alt="${text}" title="${text}" />
    <figcaption>${text}</figcaption>
  </figure>`
}

marked.setOptions({ renderer: renderer })

export default marked
