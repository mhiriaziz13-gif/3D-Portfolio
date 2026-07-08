# CMS Admin Guide

## Access

Open:

```text
/admin/login
```

Login with Ahmed's Supabase admin account. The user must also exist in `public.admins`.

## Dashboard

Open:

```text
/admin
```

The dashboard has sections for:

- Profile
- Hero
- About
- Skills
- Projects
- Project Sections
- Experience
- Education
- Certifications
- Resumes
- Social Links
- Messages
- Uploads

Each section edits JSON rows from the matching Supabase table.

## Editing Content

1. Select a section.
2. Edit the JSON array.
3. Keep valid JSON syntax.
4. Use `Save JSON`.

For new rows, use `Add row`, then fill fields and save.

For deletes:

1. Enter the row `id` or `key` for `site_settings`.
2. Click Delete row.
3. Confirm the browser prompt.

## Managing Projects

Projects live in `projects`.

Important fields:

- `slug`
- `title`
- `summary`
- `description`
- `cover_image_url`
- `tags`
- `tools`
- `featured`
- `published`
- `sort_order`

Project detail blocks live in `project_sections` and must reference `project_id`.

## Uploading Files

The Uploads form supports:

- JPG
- PNG
- WebP
- GIF
- PDF
- DOCX

SVG is rejected.

Use buckets:

- `public-assets` for reusable public media
- `project-images` for project covers
- `resumes` for CV files
- `uploads` for private/admin files

After uploading, copy the returned public URL into the relevant CMS row.

## Updating CVs

Upload PDFs/DOCX files to the `resumes` bucket.

Update rows in `resumes`:

- `label`
- `variant`
- `pdf_url`
- `docx_url`
- `published`
- `sort_order`

The public resume page disables missing links gracefully.

## Viewing Messages

Contact messages are visible in the `Messages` section and through `/api/admin/messages`.

Messages are not visible publicly.