# CMS Integration Plan: Strapi

This document outlines the step-by-step plan for integrating a self-hosted Strapi Headless CMS to manage static page content (e.g., Terms of Service, Privacy Policy, FAQ).

## Architecture Overview

To maintain security and control, the frontend Angular application will **not** call the Strapi API directly. Instead, the NestJS backend will act as a proxy. The frontend will request content from a new backend endpoint, and the backend will then fetch the data from Strapi.

```
[Angular Frontend] ---> [NestJS Backend API] ---> [Strapi CMS API]
```

This decouples the frontend from the CMS and keeps all CMS API keys secure on the server.

## Step-by-Step Implementation Plan

### Step 1: Set Up a Local Strapi Project

1.  **Create the Strapi Project:** Use the Strapi CLI to create a new project. This can be done in a separate directory outside of the monorepo, or within it if preferred.
    ```bash
    npx create-strapi-app@latest my-cms-project --quickstart
    ```
2.  **Run Strapi:** Start the Strapi development server.
3.  **Create an Admin User:** Complete the setup by creating your first administrator account.

### Step 2: Model the Content in Strapi

1.  **Navigate to the Content-Type Builder** in the Strapi admin panel.
2.  **Create a new Collection Type** named `Static Page`.
3.  **Add the following fields** to the `Static Page` collection type:
    - `title` (Type: `Text`, Required)
    - `slug` (Type: `UID`, attach to `title` field). This will automatically generate URL-friendly slugs like `privacy-policy`.
    - `contentBody` (Type: `Rich Text (Markdown)`)
4.  **Save** the content type.
5.  **Navigate to Content Manager** and create entries for `Terms of Service`, `Privacy Policy`, and `FAQ`.
6.  **Publish** the entries.
7.  **Configure Permissions:** Go to `Settings` > `Roles` > `Public` and grant `find` and `findOne` permissions for the `Static Page` content type. This makes the content readable via the API.

### Step 3: Create a Backend Endpoint in NestJS

1.  **Create a New Module:** Generate a new feature module for handling content.
    ```bash
    nx generate @nx/nest:module content --project=api --directory=src/app/modules
    ```
2.  **Create Controller and Service:** Generate a controller and service for the new module.
    ```bash
    nx generate @nx/nest:controller content --project=api --directory=src/app/modules/content
    nx generate @nx/nest:service content --project=api --directory=src/app/modules/content
    ```
3.  **Implement the Service (`content.service.ts`):**
    - Add logic to fetch data from the Strapi API. Use environment variables for the Strapi URL and API token.
    - Example Method:
      ```typescript
      import { Injectable } from '@nestjs/common';
      import { HttpService } from '@nestjs/axios'; // Make sure to import HttpModule in content.module.ts
      import { map } from 'rxjs/operators';

      @Injectable()
      export class ContentService {
        private readonly strapiUrl = process.env.STRAPI_API_URL;
        private readonly strapiToken = process.env.STRAPI_API_TOKEN;

        constructor(private http: HttpService) {}

        findOneBySlug(slug: string) {
          const requestUrl = `${this.strapiUrl}/api/static-pages?filters[slug][$eq]=${slug}`;
          return this.http
            .get(requestUrl, {
              headers: { Authorization: `Bearer ${this.strapiToken}` },
            })
            .pipe(map((response) => response.data.data[0])); // Strapi v4 returns data in a nested structure
        }
      }
      ```
4.  **Implement the Controller (`content.controller.ts`):**
    - Create a public GET endpoint that uses the service.
    - Example Endpoint:
      ```typescript
      import { Controller, Get, Param } from '@nestjs/common';
      import { ContentService } from './content.service';

      @Controller('content')
      export class ContentController {
        constructor(private readonly contentService: ContentService) {}

        @Get(':slug')
        findOne(@Param('slug') slug: string) {
          return this.contentService.findOneBySlug(slug);
        }
      }
      ```

### Step 4: Update the Frontend Service

The `static-content.service.ts` in `libs/web/public/src/lib/services` will be the bridge.

1.  **Modify the Service:** Update the service to call the new NestJS backend endpoint.
    ```typescript
    import { Injectable } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { Observable } from 'rxjs';

    @Injectable({ providedIn: 'root' })
    export class StaticContentService {
      constructor(private http: HttpClient) {}

      getContent(slug: string): Observable<any> {
        // Calls our own backend, not Strapi directly
        return this.http.get<any>(`/api/content/${slug}`);
      }
    }
    ```

### Step 5: Render Content in the Angular Component

1.  **Install a Markdown Renderer:** Add a library to safely render Markdown in Angular.
    ```bash
    npm install ngx-markdown
    ```
2.  **Import `MarkdownModule`:** In the component where you want to render the content (e.g., `privacy.page.ts`), import the `MarkdownModule`.
3.  **Use the Component:** In the component's template, use the `<markdown>` component.
    ```html
    <div *ngIf="content">
      <h1>{{ content.attributes.title }}</h1>
      <markdown [data]="content.attributes.contentBody"></markdown>
    </div>
    ```
