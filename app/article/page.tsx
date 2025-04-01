import { ArticleQuery } from "@/graphql/ArticleQuery.graphql";
import { executeQuery } from "@datocms/cda-client";
import {
  type RenderBlockContext,
  renderNodeRule,
  StructuredText,
  type StructuredTextGraphQlResponseRecord,
} from "react-datocms";
import {hasChildren, isParagraph, isRoot} from "datocms-structured-text-utils";
import './page.css'

type JsonTable = {
  columns: string[];
  data: Array<{
    [key: string]: string;
  }>;
};

const blockRenderer = (
  ctx: RenderBlockContext<StructuredTextGraphQlResponseRecord>,
) => {
  switch (ctx.record.__typename) {
    case "TableBlockRecord":
      const { table } = ctx.record;
      const { columns, data } = table as JsonTable;

      return (
        <table>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((col, j) => (
                  <td key={`${i}-${j}`}>{col}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );

    default:
      return null;
  }
};

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
                const { question, answer } = ctx.record.faq;

                return (
                  <>
                    <h2>{question}</h2>
                    <StructuredText data={answer} renderBlock={blockRenderer} />
                  </>
                );

              default:
                return null;
            }
          }}
          renderBlock={blockRenderer}
          customNodeRules={[
            // Apply different formatting to top-level paragraphs
            renderNodeRule(
              isParagraph,
              ({ adapter: { renderNode }, children, key, node }) => {
                if (hasChildren(node)) {
                  return <div key={key} className={'fake-paragraph'}>{children}</div>;
                } else {
                  // Proceed with default paragraph rendering...
                  return renderNode("p", { key }, children);
                }
              },
            ),
          ]}
        />
      )}
    </>
  );
}
