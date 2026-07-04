import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config as serverConfig } from './app/app.config.server';
import { MaterialSsrHandler, provideMaterialSsrHandler } from '@cthub-bsaas/web-core-platform';
import { provideServerRendering } from '@angular/platform-server';

const bootstrap = async (context: BootstrapContext) => {
  console.log('🚀 Starting server-side rendering bootstrap...');

  try {
    // Enhanced error logging function
    const logError = (error: unknown, context: string) => {
      if (error instanceof Error) {
        console.error(`❌ ${context} Error:`, error.message);
        console.error('Stack trace:', error.stack);
        if ('cause' in error) {
          console.error('Cause:', (error as any).cause);
        }
      } else if (typeof error === 'object' && error !== null) {
        console.error(`❌ ${context} Error:`, JSON.stringify(error, null, 2));
      } else {
        console.error(`❌ ${context} Error:`, String(error));
      }
    };

    // Log the server config for debugging
    const logSafeProviders = (providers: any[] | undefined) => {
      if (!providers) return [];
      try {
        return providers.map((p) => {
          if (Array.isArray(p)) {
            return '[EnvironmentProviders]';
          }
          if (p && typeof p === 'object') {
            return {
              provide: typeof p.provide === 'string' ? p.provide : 'Symbol',
              useValue:
                'useValue' in p
                  ? '[Object]'
                  : 'useFactory' in p
                    ? '[Factory]'
                    : 'useClass' in p
                      ? '[Class]'
                      : 'useExisting' in p
                        ? '[Existing]'
                        : '[Unknown]',
            };
          }
          return p;
        });
      } catch (err) {
        logError(err, 'Error logging providers');
        return ['[Error logging providers]'];
      }
    };

    console.log(
      '🛠️  Server config:',
      JSON.stringify(
        {
          ...serverConfig,
          providers: logSafeProviders(serverConfig.providers),
        },
        null,
        2,
      ),
    );

    // Required for PLATFORM_ID and SSR context
    const ssrConfig = {
      ...serverConfig,
      providers: [
        ...(serverConfig.providers || []),
        provideServerRendering(),
        provideMaterialSsrHandler(),
        // Add error handler for SSR
        {
          provide: 'SSR_ERROR_HANDLER',
          useValue: (error: any, context: string = '') => {
            console.error(`❌ SSR Error in ${context}:`, error);
            if (error instanceof Error && error.stack) {
              console.error('Stack trace:', error.stack);
            }
            // Don't rethrow here, let the error propagate for proper handling
          },
        },
      ],
    };

    console.log('🚀 Bootstrapping Angular application...');
    let appRef;
    try {
      appRef = await bootstrapApplication(
        AppComponent,
        { ...ssrConfig, providers: [provideZonelessChangeDetection(), ...ssrConfig.providers] },
        context,
      );
      console.log('✅ Angular application bootstrapped successfully');
    } catch (error) {
      logError(error, 'Bootstrapping application');
      console.error('❌ Critical: Failed to bootstrap Angular application');
      process.exit(1);
    }

    try {
      console.log('🔄 Initializing Material SSR handler...');
      const handler = appRef.injector.get(MaterialSsrHandler);
      handler.initialize();
      console.log('✅ Material SSR handler initialized');
    } catch (handlerError) {
      console.error('❌ Failed to initialize Material SSR handler:', handlerError);
      // Continue even if Material SSR handler fails
    }

    return appRef;
  } catch (error) {
    console.error('❌ Critical SSR Bootstrap Error:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    // Add a small delay to ensure logs are flushed
    await new Promise((resolve) => setTimeout(resolve, 100));
    throw error;
  }
};

export default bootstrap;
