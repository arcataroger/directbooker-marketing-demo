import { ArticleQuery } from "@/graphql/ArticleQuery.graphql";
import { executeQuery } from "@datocms/cda-client";
import { StructuredText } from "react-datocms";

export default async function ArticlePage() {

  const result = await executeQuery(ArticleQuery, {
    token: process.env.DATOCMS_GRAPHQL_TOKEN!,
    excludeInvalid: true,
  });

  const { article } = result;

  if (!article) {
    return <></>;
  }

  const { title, content } = article;

  return (
    <>
      <h1>{title}</h1>
      {!!content && (
        <StructuredText
          data={content}
          renderInlineRecord={(ctx) => {
            switch (ctx.record.__typename) {
              case "FaqModelRecord":
                return <></>;

              default:
                return null;
            }
          }}
          renderBlock={(ctx) => {
            switch (ctx.record.__typename) {
              case "TableBlockRecord":
                return <h3>Hello!</h3>;

              default:
                return null;
            }
          }}
        />
      )}
    </>
  );
}
