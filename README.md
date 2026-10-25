# Brightspace or Burden? Executive Function Design Test

This is a standalone, accessible, Brightspace-inspired simulation created for Alison Dodge's LDN640X project. It recreates the learner-facing prototype without requiring a Brightspace account.

## What the simulation includes

- Jordan's learner persona and testing scenario
- Course View A and Course View B
- Working page navigation and in-page buttons
- Timers for comparing the two course views
- Browser-saved page completion and checklist progress
- Participant evaluation with downloadable notes
- Educator feasibility review
- UDL-aligned design findings and discussion prompts
- Read-aloud, larger text, high contrast, responsive layout, keyboard access, and reduced-motion support

The site does not connect to Brightspace, submit assignments, collect participant data, or report grades. All progress and typed responses remain in the visitor's browser.

## Adding the recorded walkthrough

When the final recording is ready, save it as `assets/project-walkthrough.mp4`. Replace the `.video-placeholder` block in `index.html` with:

```html
<video class="project-video" controls preload="metadata" poster="assets/brightspace-burden-hero.png">
  <source src="assets/project-walkthrough.mp4" type="video/mp4">
  Your browser does not support embedded video. Use the written transcript below the video instead.
</video>
```

Use a captioned version of the recording and provide a written transcript with the final project.

## GitHub Pages

Upload the **contents of the `dist` folder** to the root of a GitHub repository. In the repository, open **Settings → Pages**, choose **Deploy from a branch**, select the main branch and root folder, and save.

## Local preview

Open `dist/index.html` in a browser, or serve the `dist` folder with any static web server.
