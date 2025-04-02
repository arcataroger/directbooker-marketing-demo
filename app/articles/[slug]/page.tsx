import { AllArticlesQuery, ArticleQuery } from "@/graphql/ArticleQuery.graphql";
import { executeQuery } from "@datocms/cda-client";
import {
  type RenderBlockContext,
  renderNodeRule,
  StructuredText,
  type StructuredTextGraphQlResponseRecord,
} from "react-datocms";
import {
  hasChildren,
  isHeading,
  isParagraph,
  type RenderRule,
  type TrasformFn,
} from "datocms-structured-text-utils";
import type { VariablesOf } from "gql.tada";
import { notFound } from "next/navigation";
import { render as toPlainText } from "datocms-structured-text-to-plain-text";
import slugify from "@sindresorhus/slugify";
import { createElement } from "react";

type JsonTable = {
  columns: string[];
  data: Array<{
    [key: string]: string;
  }>;
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const result = await executeQuery(ArticleQuery, {
    token: process.env.DATOCMS_GRAPHQL_TOKEN!,
    excludeInvalid: true,
    variables: {
      slug: slug,
    } as VariablesOf<typeof ArticleQuery>,
  });

  const { article } = result;

  if (!article) {
    notFound();
  }

  const { title, content } = article;

  const customNodeRules: RenderRule<TrasformFn, TrasformFn, TrasformFn>[] = [
    // Add HTML anchors to heading levels for in-page navigation
    renderNodeRule(isHeading, ({ node, children, key }) => {
      const HeadingTag = `h${node.level}`;
      const slug = slugify(toPlainText(node)!) ?? key;

      return createElement(
        "a",
        {
          key,
          href: `#${slug}`,
        },
        createElement(
          HeadingTag,
          {
            id: slug,
          },
          children,
        ),
      );
    }),

    // Workaround for structured text bug where everything is a p tag by default and can't nest other things
    renderNodeRule(
      isParagraph,
      ({ adapter: { renderNode }, children, key, node }) => {
        if (hasChildren(node)) {
          return (
            <div key={key} className={"fake-paragraph"}>
              {children}
            </div>
          );
        } else {
          // Proceed with default paragraph rendering...
          return renderNode("p", { key }, children);
        }
      },
    ),
  ];

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
                const slug = slugify(question);

                return (
                  <>
                    <a href={`#${slug}`}>
                      <h2 id={slug}>{question}</h2>
                    </a>
                    <StructuredText
                      data={answer}
                      renderBlock={blockRenderer}
                      customNodeRules={customNodeRules}
                    />
                  </>
                );

              default:
                return null;
            }
          }}
          renderBlock={blockRenderer}
          customNodeRules={customNodeRules}
        />
      )}
    </>
  );
}

export async function generateStaticParams() {
  const result = await executeQuery(AllArticlesQuery, {
    token: process.env.DATOCMS_GRAPHQL_TOKEN!,
    excludeInvalid: true,
  });

  return result.allArticles.map(({ slug }) => ({
    slug,
  }));
}

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
                {Object.values(row).map((col, j) => {
                  const prettyColumn = col
                    .replace(/^\s*✓\s*/, "✅ ")
                    .replace(/^\s*X\s*/, "❌ ");

                  return <td key={`${i}-${j}`}>{prettyColumn}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );

    default:
      return (
        <>
          <h4 style={{ color: "red" }}>
            Warning: Unhandled block of type &#39;{ctx.record.__typename}&#39;
          </h4>
          <pre>
            <code>{JSON.stringify(ctx.record, null, 2)}</code>
          </pre>
        </>
      );
  }
};
