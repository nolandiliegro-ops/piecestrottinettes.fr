/**
 * Sentry Configuration for PiècesTrottinettes
 * Mission 3.5 - Monitoring & Error Tracking
 */

import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export const initSentry = () => {
  // Only initialize in production
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      
      // Set environment
      environment: import.meta.env.MODE,
      
      // Performance Monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Performance Monitoring - Sample rate for transactions
      tracesSampleRate: 1.0, // 100% in production, adjust based on traffic
      
      // Session Replay - Sample rate
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Release tracking
      release: `piecestrottinettes@${import.meta.env.VITE_APP_VERSION || "1.0.0"}`,
      
      // Before sending events, filter out sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
            if (breadcrumb.data) {
              // Remove passwords, tokens, etc.
              const { password, token, apiKey, ...safeData } = breadcrumb.data;
              return { ...breadcrumb, data: safeData };
            }
            return breadcrumb;
          });
        }
        
        // Remove sensitive request data
        if (event.request) {
          if (event.request.headers) {
            delete event.request.headers.Authorization;
            delete event.request.headers.Cookie;
          }
        }
        
        return event;
      },
      
      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        "top.GLOBALS",
        // Random plugins/extensions
        "originalCreateNotification",
        "canvas.contentDocument",
        "MyApp_RemoveAllHighlights",
        // Network errors
        "NetworkError",
        "Network request failed",
        // Supabase auth errors (expected)
        "AuthSessionMissingError",
      ],
    });
    
    console.log("✅ Sentry initialized");
  } else {
    console.log("ℹ️ Sentry disabled in development");
  }
};

/**
 * Capture a custom error with context
 */
export const captureError = (
  error: Error,
  context?: Record<string, any>
) => {
  if (context) {
    Sentry.setContext("custom", context);
  }
  Sentry.captureException(error);
};

/**
 * Capture a custom message
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = "info"
) => {
  Sentry.captureMessage(message, level);
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (user: {
  id: string;
  email?: string;
  username?: string;
}) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

/**
 * Clear user context (on logout)
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for tracking user actions
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
};

/**
 * Start a span for performance monitoring
 * Note: startTransaction was deprecated in Sentry v8+, use startSpan instead
 */
export const startSpan = (name: string, op: string, callback: () => void) => {
  return Sentry.startSpan({ name, op }, callback);
};

export default Sentry;
