const slugify = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const readableDate = (dateObj) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);

module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter("readableDate", readableDate);
  eleventyConfig.addFilter("slugify", slugify);
  eleventyConfig.addFilter("absoluteUrl", (url, base) => {
    if (!url) return "";
    return new URL(url, base).toString();
  });
  eleventyConfig.addFilter("filterByTag", (collection, tag) =>
    collection.filter((item) => (item.data.tags || []).includes(tag))
  );

  eleventyConfig.addCollection("blogPosts", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("content/blog/posts/*.md")
      .sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addCollection("tagList", (collectionApi) => {
    const tags = new Set();
    collectionApi.getFilteredByGlob("content/blog/posts/*.md").forEach((item) => {
      (item.data.tags || [])
        .filter((tag) => tag !== "blog")
        .forEach((tag) => tags.add(tag));
    });
    return [...tags].sort();
  });

  eleventyConfig.addPassthroughCopy("index.html");
  eleventyConfig.addPassthroughCopy("styles.css");
  eleventyConfig.addPassthroughCopy("scripts");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("data");
  eleventyConfig.addPassthroughCopy("favicon.svg");

  return {
    dir: {
      input: "content",
      includes: "_includes",
      data: "_data",
      output: "dist",
    },
    markdownTemplateEngine: "njk",
  };
};
