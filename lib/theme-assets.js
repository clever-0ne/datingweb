/**
 * The Conult theme's asset manifest for the public marketing pages.
 *
 * Plain module, deliberately: these lists are read by LandingShell (a Server
 * Component) and LandingBoot (a Client Component). An array exported from a
 * 'use client' file is a client *reference* when a Server Component imports it,
 * not the array itself — so the manifest lives here, where both can read it as
 * the real thing.
 */

export const VENDOR_CSS = [
  '/theme/vendors/bootstrap/css/bootstrap.min.css',
  '/theme/vendors/animate/animate.min.css',
  '/theme/vendors/animate/custom-animate.css',
  '/theme/vendors/fontawesome/css/all.min.css',
  '/theme/vendors/swiper/swiper.min.css',
  '/theme/vendors/odometer/odometer.min.css',
  '/theme/vendors/conult-icons/style.css',
  '/theme/vendors/reey-font/stylesheet.css',
  '/theme/css/style.css',
  '/theme/css/responsive.css',
];

/**
 * Boot order matters: every file after jQuery is a jQuery plugin, and
 * conult.js initialises against all of them. See LandingBoot for how the
 * ordering is preserved while still downloading them in parallel.
 */
export const VENDOR_JS = [
  '/theme/vendors/jquery/jquery-3.6.0.min.js',
  '/theme/vendors/bootstrap/js/bootstrap.bundle.min.js',
  '/theme/vendors/wow/wow.js',
  '/theme/vendors/swiper/swiper.min.js',
  '/theme/vendors/odometer/odometer.min.js',
  '/theme/vendors/jquery-appear/jquery.appear.min.js',
];

/** The theme's own initialisers. Runs last, on its own. */
export const BOOT_JS = '/js/conult.js';
