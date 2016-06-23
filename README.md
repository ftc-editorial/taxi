#Usage

`git clone https://github.com/FTChinese/interactive-report.git`

Run `gulp serve` for development.

Run `gulp` to build the final files for distribution.

Run `gulp deploy` for production.

# Custom css and js

Custom css should be put into `app/styles/custom.css` and  and js into `app/scripts/visual.js`.

# Change backgrounds

`app/styles/backgrounds.css` is left for you to add/alter custom background images. Run `gulp serve` to preview before making changes.

## Cover Image

Do not add cover image via `background.css`. To add a cover image, find `<img class="story-cover" src="" />` following the `body` tag and replace `src` with your cover image path.


# Todo
- Replace local image path with FT responsive service on deploy
- Split structure and data, probably with mustache and yaml/markdown.

