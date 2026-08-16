# 📸 Photos

Drop the pictures for the **"How Old Is She Here?"** round in this folder.

## Adding photos from github.com (no git needed)

1. Open this folder on GitHub → **Add file** → **Upload files**
2. Drag your images in → **Commit changes**
3. Open [`data/content.js`](../data/content.js), find the `photoage` round, and
   point each question at its file:

```js
{ image: "../img/photo1.jpg", caption: "Exhibit A", answer: 5, min: 0, max: 25 },
```

`answer` is how old she actually was in that photo.

## Rules of thumb

- **Names:** no spaces. `age7.jpg`, `prom.png`, `beach-2019.jpg`.
- **Size:** resize to about 1000px on the long edge. Straight-off-the-phone
  photos are 4–8 MB each and will crawl on party wifi.
- **Shape:** displayed as a 4:5 portrait crop, centred. Faces near the middle
  survive the crop best.
- **Formats:** `.jpg`, `.png`, `.webp` all work.

Until a file actually exists you'll see a striped "add a photo" placeholder in
the game — that's the intended fallback, not a bug.

⚠️ Anything committed here is served publicly by GitHub Pages, so only put in
photos you're happy for party guests (and the open internet) to see.
