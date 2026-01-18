const asArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

module.exports = {
  eleventyComputed: {
    layout: (data) =>
      data.page.inputPath.endsWith(".md")
        ? "layouts/blog-post.njk"
        : data.layout,
    mainClass: (data) =>
      data.page.inputPath.endsWith(".md") ? "blog" : data.mainClass,
    ogType: (data) =>
      data.page.inputPath.endsWith(".md") ? "article" : data.ogType,
    tags: (data) => {
      if (!data.page.inputPath.endsWith(".md")) return data.tags;
      const tags = new Set(["blog", ...asArray(data.tags)]);
      return Array.from(tags);
    },
    permalink: (data) => {
      if (!data.page.inputPath.endsWith(".md")) return data.permalink;
      const date = data.page.date;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `/blog/${year}/${month}/${data.page.fileSlug}/`;
    },
  },
};
