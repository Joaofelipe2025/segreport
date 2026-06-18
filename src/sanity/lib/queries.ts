import { client } from "./client";

const articleFields = `
  _id,
  title,
  slug,
  summary,
  status,
  publishedAt,
  featured,
  "mainImage": mainImage { asset->, alt, caption },
  videoUrl,
  "author": author->{ name, slug, photo, role },
  "category": category->{ title, slug, color },
  "tags": tags[]->{ title, slug }
`;

export async function getArticles(limit = 20) {
  return client.fetch(
    `*[_type == "article" && status == "published"] | order(publishedAt desc)[0...$limit] { ${articleFields} }`,
    { limit }
  );
}

export async function getArticleBySlug(slug: string) {
  return client.fetch(
    `*[_type == "article" && slug.current == $slug][0] { ${articleFields}, body }`,
    { slug }
  );
}

export async function getArticlesByCategory(categorySlug: string, limit = 20) {
  return client.fetch(
    `*[_type == "article" && status == "published" && category->slug.current == $categorySlug] | order(publishedAt desc)[0...$limit] { ${articleFields} }`,
    { categorySlug, limit }
  );
}

export async function getArticlesByTag(tagSlug: string, limit = 20) {
  return client.fetch(
    `*[_type == "article" && status == "published" && $tagSlug in tags[]->slug.current] | order(publishedAt desc)[0...$limit] { ${articleFields} }`,
    { tagSlug, limit }
  );
}

export async function getFeaturedArticles(limit = 5) {
  return client.fetch(
    `*[_type == "article" && status == "published" && featured == true] | order(publishedAt desc)[0...$limit] { ${articleFields} }`,
    { limit }
  );
}

export async function getCategories() {
  return client.fetch(`*[_type == "category"] | order(title asc) { _id, title, slug, color, description }`);
}

export async function getAuthors() {
  return client.fetch(`*[_type == "author"] | order(name asc) { _id, name, slug, photo, role, bio }`);
}
