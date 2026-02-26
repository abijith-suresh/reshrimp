import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

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

export const collections = { changelog };
