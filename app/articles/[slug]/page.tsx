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

// Default Next export that generates a page
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Get the slug from the URL
  const { slug } = await params;

  // Query the Dato API based on the slug. The full query is in /graphql/ArticleQuery.graphql.ts

  // This whole executeQuery thing is from our beta CDA client (https://www.npmjs.com/package/@datocms/cda-client)
  // And combined with gql.tada for GraphQL typescript support (https://gql-tada.0no.co/)
  // If you don't care about all that, you can also just make a simple fetch() request directly
  // GraphQL API docs here: https://www.datocms.com/docs/content-delivery-api
  const result = await executeQuery(ArticleQuery, {
    token: process.env.DATOCMS_GRAPHQL_TOKEN!,
    excludeInvalid: true,
    variables: {
      slug: slug,
    } as VariablesOf<typeof ArticleQuery>,
  });

  const { article } = result;

  // 404 if invalid slug
  if (!article) {
    notFound();
  }

  // This is all fully (and automatically) typed because of gql.tada!
  const { title, content } = article;

  // The actual rendering logic for this page
  return (
    <>
      <h1>{title}</h1>
      {!!content && (
        <StructuredText
          data={content} // This is in a "DAST" format, a JSON-based syntax tree: https://www.datocms.com/blog/how-to-use-datocms-structured-text-field-in-a-nextjs-app
          // This defines how we render a particular type of inlined record, in this case a reusable FAQ entry
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

              // In a real page, you would account for every possible inlined record type
              // But for this demo, we just skip over anything we don't know how to handle
              default:
                return null;
            }
          }}
          renderBlock={blockRenderer} // Similarly, this is how we render blocks. In its own function because multiple <StructuredTexts/> can reuse the same blocks.
          customNodeRules={customNodeRules} // We use this to override some default renderers for headings and paragraph tags
        />
      )}
    </>
  );
}

// This queries our API and lets Next pre-build all the articles
// For the demo, in the global layout.tsx, we set a revalidate=1 so every page gets checked at most once a second
// For prod, you'd normally use a value like revalidate=60 (1 min) or use cache tags or webhooks to invalidate
// See https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration
export async function generateStaticParams() {
  const result = await executeQuery(AllArticlesQuery, {
    token: process.env.DATOCMS_GRAPHQL_TOKEN!,
    excludeInvalid: true,
  });

  return result.allArticles.map(({ slug }) => ({
    slug,
  }));
}

// A reusable set of rendering rules that tells StructuredText how to render your custom blocks
const blockRenderer = (
  ctx: RenderBlockContext<StructuredTextGraphQlResponseRecord>,
) => {
  switch (ctx.record.__typename) {
    // The tables plugin gives us back JSON and we can render that into whatever we want, including HTML tables or cards
    // In production you'd probably want to make something responsive and mobile-friendly
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

    // For this demo, this warns you when you have an unhandled block type
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

// Custom output type for the tables plugin that Theresa used: https://www.datocms.com/marketplace/plugins/i/datocms-plugin-table-editor
type JsonTable = {
  columns: string[];
  data: Array<{
    [key: string]: string;
  }>;
};

// Custom rendering rules for the Structured Text Fields
const customNodeRules: RenderRule<TrasformFn, TrasformFn, TrasformFn>[] = [
  // Add clickable IDs (in-page anchors) to heading levels for in-page navigation
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

  // Workaround for a cosmetic Structured Text bug where everything is a p tag by default and can't semantically nest other tags
  // Without this, the page still works but may cause a hydration error with certain Next configs
  renderNodeRule(
    isParagraph,
    ({ adapter: { renderNode }, children, key, node }) => {
      // If the node has children, we render it as a <div> with margins instead of a <p>
      if (hasChildren(node)) {
        return (
          <div key={key} className={"fake-paragraph"}>
            {children}
          </div>
        );
      } else {
        // Or else just render it as a regular <p>
        return renderNode("p", { key }, children);
      }
    },
  ),
];
