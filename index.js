#!/usr/bin/env node

const express = require("express");
const multer = require("multer");
const fs = require("fs");

const app = express();
const port = 3000;
const uploadDirectory = ".";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

app.use("/download", express.static(uploadDirectory));

const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>File Upload</title>
</head>
<body>
    <h1>File Upload</h1>
    <p>%%message%%</p>
    <form action="/" method="POST" enctype="multipart/form-data">
        <input type="file" name="file">
        <button type="submit">Upload</button>
    </form>
    <ul>
    %%downloads%%
    </ul>
</body>
</html>
`;

function getHtml(params) {
  let html = htmlTemplate;
  for (const key in params) {
    html = html.replace(`%%${key}%%`, params[key]);
  }
  return html;
}

function htmlEscape(str) {
  return str.replace(
    /[&<>]/,
    (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[s])
  );
}

function getDownloadHtml() {
  const files = fs.readdirSync(uploadDirectory, { withFileTypes: true });
  let html = "";
  for (const fileEntry of files) {
    if (!fileEntry.isFile()) {
      continue;
    }
    const fileName = fileEntry.name;
    html += `<li><a href="download/${encodeURIComponent(
      fileName
    )}">${htmlEscape(fileName)}</a></li>`;
  }
  return html;
}

app.get("/", (req, res) =>
  res.send(getHtml({ message: "", downloads: getDownloadHtml() }))
);

app.post("/", upload.single("file"), (req, res) => {
  res.send(
    getHtml({
      message: `Uploaded ${req.file.originalname}`,
      downloads: getDownloadHtml(),
    })
  );
});

app.listen(port, () => {
  console.log(`Uploader listening on
http://localhost:${port}/`);
});
