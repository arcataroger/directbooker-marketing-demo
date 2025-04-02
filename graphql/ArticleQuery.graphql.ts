import { datoGraphql } from "@/graphql/graphql-lib";

const TableFragment = datoGraphql(
  //language=gql
  `
        fragment TableFragment on TableBlockRecord @_unmask {
            __typename
            id
            table
            caption
        }`,
);

const ButtonFragment = datoGraphql(
  //language=gql
  `fragment ButtonFragment on ButtonRecord @_unmask {
        __typename
        id
        label
        primary
        url
    }
    `,
);

const MediaFragment = datoGraphql(
  //language=gql
  `fragment MediaFragment on ImageBlockRecord @_unmask {
        __typename
        id
        image {
            id
            title
            thumbhash
            tags
            smartTags
            md5
            mimeType
            alt
            author
            basename
            blurUpThumb
            blurhash
            copyright
            exifInfo
            customData
            format
            height
            width
            responsiveImage {
                src
                srcSet
                sizes
                base64
                bgColor
                aspectRatio
                height
                width
            }
            video {
                thumbnailUrl
                thumbhash
                streamingUrl
                title
                width
                height
                blurUpThumb
                blurhash
                alt
            }
        }
    }
    `,
);

export const ArticleQuery = datoGraphql(
  //language=gql
  `
        query ArticleQuery($slug: String!) {
            article(filter: {slug: {eq: $slug}}) {
                id
                title
                slug
                content {
                    value
                    blocks {
                        ...TableFragment
                        ...ButtonFragment
                        ...MediaFragment
                    }
                    links {
                        ... on FaqModelRecord {
                            __typename
                            id
                            faq {
                                __typename
                                id
                                question
                                answer {
                                    value
                                    blocks {
                                        ...TableFragment
                                        ... on NewsletterSubscriptionRecord {
                                            __typename
                                            id
                                        }
                                        ... on CtaButtonWithImageRecord {
                                            __typename
                                            id
                                        }
                                    }
                                }
                            }
                        }

                        ... on ArticleRecord {
                            __typename
                            id
                            slug
                            title
                        }
                    }
                }
            }
        }`,
  [TableFragment, ButtonFragment, MediaFragment],
);

export const AllArticlesQuery = datoGraphql(
  //language=graphql
  `
      query MyQuery {
          allArticles(first: "500") {
              slug
              id
              title
          }
      }`,
);
