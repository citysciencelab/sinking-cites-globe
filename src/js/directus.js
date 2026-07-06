import { createDirectus, rest } from "@directus/sdk";

const directusUrl = process.env.VUE_APP_DIRECTUS_URL;

export const directus = createDirectus(directusUrl).with(rest());
