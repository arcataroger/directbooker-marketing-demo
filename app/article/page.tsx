import { ArticleQuery } from "@/graphql/ArticleQuery.graphql";
import { executeQuery } from "@datocms/cda-client";

export default async function ArticlePage() {
  const result = await executeQuery(ArticleQuery, {
    token: process.env.DATOCMS_GRAPHQL_TOKEN!,
  });

  return (
    <>
      <h1>Test</h1>
      <pre>
        <code>{JSON.stringify(result, null, 2)}</code>
      </pre>
    </>
  );
}
