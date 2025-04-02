import { executeQuery } from "@datocms/cda-client";
import { AllArticlesQuery } from "@/graphql/ArticleQuery.graphql";
import Link from "next/link";

export default async function ArticlesListing() {
  const result = await executeQuery(AllArticlesQuery, {
    token: process.env.DATOCMS_GRAPHQL_TOKEN!,
    excludeInvalid: true,
  });

  const { allArticles } = result;

  return (
    <>
      <h2>Articles:</h2>
      <ul>
        {allArticles.map((article) => (
          <li key={article.id}>
            <Link href={`/articles/${article.slug}`} prefetch={true}>
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
