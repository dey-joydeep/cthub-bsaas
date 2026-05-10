import { APP_BASE_HREF } from '@angular/common';
import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'zone.js/node';
import bootstrap from './main.server';

// Static ESM import for CommonEngine
import { CommonEngine } from '@angular/ssr/node';

// Enable more verbose error logging
process.env['DEBUG'] = 'angular-ssr:*';
console.log('Server starting with environment:', process.env['NODE_ENV'] || 'development');

// Enable stack trace limit for better error debugging
Error.stackTraceLimit = 50;

// Server configuration
const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

// Create Express server
const app = express();

// Set up view engine
app.set('view engine', 'html');
app.set('views', browserDistFolder);

// Global error handler middleware
const globalErrorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('\n🔥 Unhandled error in request:', req.originalUrl);
  console.error('Error:', err);

  if (err instanceof Error) {
    console.error('Error stack:', err.stack);
  }

  // Send appropriate response based on environment
  if (process.env['NODE_ENV'] !== 'production') {
    res.status(500).json({
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'An unknown error occurred',
      stack: process.env['NODE_ENV'] !== 'production' && err instanceof Error ? err.stack : undefined,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  } else {
    res.status(500).send('An error occurred. Please try again later.');
  }
};

// Apply global error handler
app.use(globalErrorHandler);

// SSR error handler
const ssrErrorHandler = (error: unknown, req: Request): { status: number; message: string; error: any } => {
  console.error('\n🚨 SSR Error during request to:', req.originalUrl);
  console.error('Error:', error);

  if (error instanceof Error) {
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Log additional error properties if they exist
    const additionalProps = Object.getOwnPropertyNames(error)
      .filter((prop) => !['name', 'message', 'stack'].includes(prop))
      .reduce(
        (obj, prop) => ({
          ...obj,
          [prop]: (error as any)[prop],
        }),
        {},
      );

    if (Object.keys(additionalProps).length > 0) {
      console.error('Additional error properties:', JSON.stringify(additionalProps, null, 2));
    }
  } else if (typeof error === 'object' && error !== null) {
    console.error('Error details:', JSON.stringify(error, null, 2));
  }

  console.error('\n🚨 SSR Error during request to:', req.originalUrl);
  console.error('Error:', error);

  let errorDetails: any;

  if (error instanceof Error) {
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Get additional error properties
    const additionalProps = Object.getOwnPropertyNames(error)
      .filter((prop) => !['name', 'message', 'stack'].includes(prop))
      .reduce(
        (obj, prop) => ({
          ...obj,
          [prop]: (error as any)[prop],
        }),
        {},
      );

    if (Object.keys(additionalProps).length > 0) {
      console.error('Additional error properties:', JSON.stringify(additionalProps, null, 2));
    }

    errorDetails = {
      name: error.name,
      message: error.message,
      stack: process.env['NODE_ENV'] !== 'production' ? error.stack : undefined,
      ...additionalProps,
    };
  } else if (typeof error === 'object' && error !== null) {
    console.error('Error details:', JSON.stringify(error, null, 2));
    errorDetails = error;
  } else {
    errorDetails = String(error);
  }

  return {
    status: 500,
    message: 'Server-side rendering error',
    error: errorDetails,
  };
};

const engine = new CommonEngine({
  enablePerformanceProfiler: true,
  bootstrap,
  providers: [
    { provide: APP_BASE_HREF, useValue: '/' },
    // Add error handler for SSR
    {
      provide: 'ERROR_HANDLER',
      useValue: (error: any) => {
        console.error('SSR Error:', error);
        if (error instanceof Error) {
          console.error('Error stack:', error.stack);
        }
        return { status: 500, message: 'Server-side rendering error' };
      },
    },
    // Provide empty objects for REQUEST and RESPONSE tokens
    { provide: 'REQUEST', useValue: {} },
    { provide: 'RESPONSE', useValue: {} },
    // Mock browser APIs that might be accessed during SSR
    { provide: 'WINDOW', useValue: globalThis },
    { provide: 'DOCUMENT', useValue: { body: {}, addEventListener: () => {}, removeEventListener: () => {} } },
    { provide: 'LOCAL_STORAGE', useValue: {} },
    { provide: 'SESSION_STORAGE', useValue: {} },
    // Ensure we're in server mode for route extraction
    { provide: 'ROUTE_EXTRACTION', useValue: true },
    { provide: 'SSR', useValue: true },
    { provide: 'BROWSER', useValue: false },
    // Add platform location for server-side rendering
    { provide: 'PLATFORM_ID', useValue: 'server' },
    // Mock for Dd provider (DataDog or similar analytics/monitoring service)
    {
      provide: 'Dd',
      useValue: {
        // Mock methods that might be called during SSR
        setUser: () => {},
        track: () => {},
        pageView: () => {},
        error: (error: Error) => console.error('Analytics error:', error),
        // Add other methods as needed based on actual usage
      } as const,
    },
    // Add error handler to prevent uncaught promise rejections
    { provide: 'ERROR_HANDLER', useValue: (error: any) => console.error('SSR Error:', error) },
  ],
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
// Serve static files with cache control
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
    setHeaders: (res, path) => {
      if (path.endsWith('.css') || path.endsWith('.js') || path.endsWith('.woff2') || path.endsWith('.woff') || path.endsWith('.ttf')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
    },
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
// Handle all other requests by rendering the Angular application.
app.get('*', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;
  const startTime = Date.now();

  // Log request for debugging
  console.log(`\n📡 [${new Date().toISOString()}] Request for: ${originalUrl}`);
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(headers, null, 2));

  // Set no-cache headers for HTML to ensure fresh content on each request during development
  if (process.env['NODE_ENV'] !== 'production') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }

  // Log request body if present
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }

  const renderOptions = {
    bootstrap,
    documentFilePath: indexHtml,
    url: `${protocol}://${headers.host}${originalUrl}`,
    publicPath: browserDistFolder,
    providers: [
      { provide: APP_BASE_HREF, useValue: baseUrl },
      { provide: 'REQUEST', useValue: req },
      { provide: 'RESPONSE', useValue: res },
      { provide: 'SSR', useValue: true },
      { provide: 'BROWSER', useValue: false },
      // Add error handler for this request
      {
        provide: 'ERROR_HANDLER',
        useValue: (error: any) => ssrErrorHandler(error, req),
      },
    ],
  };

  console.log('Starting SSR render...');

  engine
    .render(renderOptions)
    .then((html: string) => {
      const renderTime = Date.now() - startTime;
      console.log(`✅ SSR render completed in ${renderTime}ms`);
      res.send(html);
    })
    .catch((err: Error) => {
      console.error('Error during server-side rendering:', err);
      next(err);
    });
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;
