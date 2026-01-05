module.exports = {
  layout: "layouts/blog-post.njk",
  tags: ["blog"],
  ogType: "article",
  permalink: (data) => {
    const date = data.page.date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `/blog/${year}/${month}/${data.page.fileSlug}/`;
  },
};
