module.exports = {
  layout: "layouts/note.njk",
  tags: ["notes"],
  ogType: "article",
  permalink: (data) => {
    const date = data.page.date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `/notes/${year}/${month}/${data.page.fileSlug}/`;
  },
};
