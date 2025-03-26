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
                    id
                    table
                    caption
                }
            }
            links {
                ... on FaqModelRecord {
                    id
                    faq {
                        id
                        question
                        answer {
                            value
                            blocks {
                                ... on TableBlockRecord {
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
