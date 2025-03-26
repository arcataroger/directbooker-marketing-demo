import { datoGraphql } from "@/graphql/graphql-lib";

export const ArticleQuery = datoGraphql(
  `
    query MyQuery {
    article(locale: en) {
        id
        title
        slug
        content {
            value
            blocks {
                ... on TableBlockRecord {
                    __typename
                    id
                    table
                    caption
                }
            }
            links {
                ... on FaqModelRecord {
                    id
                    faq {
                        __typename
                        id
                        question
                        answer {
                            value
                            blocks {
                                ... on TableBlockRecord {
                                    __typename
                                    id
                                    table
                                    caption
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}`,
);
