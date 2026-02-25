import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    author: z.string().default("Reshrimp Team"),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const changelog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/changelog" }),
  schema: z.object({
    version: z.string(),
    date: z.coerce.date(),
    title: z.string(),
    summary: z.string(),
    type: z.enum(["major", "minor", "patch"]).default("patch"),
  }),
});

export const collections = { blog, changelog };
