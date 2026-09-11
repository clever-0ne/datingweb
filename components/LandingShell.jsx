import { SITE } from '@/lib/plans';
import { VENDOR_CSS, VENDOR_JS, BOOT_JS } from '@/lib/theme-assets';
import LandingBoot from '@/components/LandingBoot';

/**
 * Shared chrome for the public marketing pages, ported from the Archive 2
 * Conult theme. Two header variants exist in the original Laravel app:
 *
 *   - 'three'   → `home/index.blade.php`, the landing page (main-menu-three)
 *   - 'default' → `layouts/base.blade.php`, every inner page (main-header)
 *
 * The theme's own stylesheets and scripts are scoped to these pages — nothing
 * inside the app shell or the admin console should inherit the Conult theme —
 * so they are deliberately not in the root layout. The stylesheets are linked
 * here; the scripts are loaded by <LandingBoot />, for the reason given there.
 */

const NAV_LINKS = [
  ['/', 'Home'],
  ['/about', 'About'],
  ['/faq', 'F.A.Q'],
  ['/terms', 'Terms'],
  ['/register', 'Register'],
  ['/login', 'Login'],
  ['/contact', 'Contact Us'],
];

function NavList() {
  return (
    <ul className="main-menu__list">
      {NAV_LINKS.map(([href, label]) => (
        <li key={href}>
          <a href={href}>{label}</a>
        </li>
      ))}
    </ul>
  );
}

function HeaderThree() {
  return (
    <header className="main-header main-header-three clearfix">
      <nav className="main-menu main-menu-three clearfix">
        <div className="main-menu-three__wrapper clearfix">
          <div className="main-menu-three__wrapper-logo">
            <a href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="logo" src="/assets/logo.svg" width="176" alt={SITE.name} />
            </a>
          </div>
          <div className="main-menu-three__wrapper-main-menu">
            <a href="#" className="mobile-nav__toggler">
              <i className="fa fa-bars"></i>
            </a>
            <NavList />
          </div>
        </div>
      </nav>
    </header>
  );
}

function HeaderDefault() {
  return (
    <header className="main-header clearfix">
      <div className="main-header__top clearfix">
        <div className="main-header__top-inner clearfix">
          <div className="main-header__top-left">
            <ul className="list-unstyled main-header__top-address">
              <li>
                <div className="icon">
                  <span className="icon-pin"></span>
                </div>
                <div className="text">
                  <p>{SITE.address}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <nav className="main-menu clearfix">
        <div className="main-menu-wrapper clearfix">
          <div className="main-menu-wrapper__left">
            <div className="main-menu-wrapper__logo">
              <a href="/">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="logo" src="/assets/logo.svg" width="176" alt={SITE.name} />
              </a>
            </div>
            <div className="main-menu-wrapper__main-menu">
              <a href="#" className="mobile-nav__toggler">
                <i className="fa fa-bars"></i>
              </a>
              <NavList />
            </div>
          </div>
          <div className="main-menu-wrapper__right">
            <div className="main-menu-wrapper__call">
              <div className="main-menu-wrapper__call-icon">
                <span className="icon-phone"></span>
              </div>
              <div className="main-menu-wrapper__call-number">
                <p>Call Anytime</p>
                <h5>
                  <a href="#">{SITE.phone}</a>
                </h5>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default function LandingShell({ variant = 'three', children }) {
  return (
    <>
      {VENDOR_CSS.map((href) => (
        <link rel="stylesheet" href={href} key={href} />
      ))}

      {/* The vendor scripts are injected after hydration (see LandingBoot), so
          without this the browser only discovers them once React has mounted,
          losing a round trip on every first visit. Preloading them here starts
          the download during HTML parse; the later injection then finds them in
          the cache and only has to execute them. */}
      {[...VENDOR_JS, BOOT_JS].map((href) => (
        <link rel="preload" as="script" href={href} key={`pre-${href}`} />
      ))}

      {/* No `.preloader` here on purpose. The theme's preloader is a fixed,
          full-screen white overlay that is only dismissed from inside a
          `$(window).on("load")` handler in conult.js — and on a React-rendered
          page that handshake does not land, leaving the overlay up forever and
          swallowing every click. Nothing here should depend on it. */}

      <div className="page-wrapper">
        {variant === 'three' ? <HeaderThree /> : <HeaderDefault />}

        <div className="stricky-header stricked-menu main-menu main-menu-three">
          <div className="sticky-header__content"></div>
        </div>

        {children}

        <footer className="site-footer">
          <div className="container">
            <div className="site-footer__top">
              <div className="row">
                <div className="col-xl-5 col-lg-5 wow fadeInUp" data-wow-delay="100ms">
                  <div className="site-footer__top-left">
                    <div className="site-footer__top-logo-content">
                      <a href="/">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="logo" src="/assets/logo.svg" width="146" alt={SITE.name} />
                      </a>
                      <p className="site-footer__top-text">
                        Our commitment to high-quality investment returns, ensures our clients can
                        make valuable returns in a rapidly evolving business environment.
                      </p>
                    </div>
                    <div className="site-footer__top-newsletter">
                      <h5 className="site-footer__top-newsletter-title">
                        Contact us for investment products and services
                      </h5>
                      <form className="site-footer__top-newsletter-form">
                        <div className="site-footer__top-newsletter-input-box">
                          <input type="email" placeholder="Email Address" name="email" />
                          <button type="submit" className="site-footer__top-newsletter-btn">
                            Go
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="col-xl-7 col-lg-7">
                  <div className="site-footer__top-right">
                    <div className="site-footer__top-widget-box">
                      <div className="row">
                        <div className="col-xl-3 col-lg-3 col-md-4 wow fadeInUp" data-wow-delay="100ms">
                          <div className="footer-widget__column footer-widget__explore clearfix">
                            <h3 className="footer-widget__title">Explore</h3>
                            <ul className="footer-widget__explore-list list-unstyled clearfix">
                              <li>
                                <a href="/">Home</a>
                              </li>
                              <li>
                                <a href="/about">About</a>
                              </li>
                              <li>
                                <a href="/faq">F.A.Q</a>
                              </li>
                              <li>
                                <a href="/register">Create Account</a>
                              </li>
                              <li>
                                <a href="/login">Account Login</a>
                              </li>
                            </ul>
                          </div>
                        </div>
                        <div className="col-xl-3 col-lg-3 col-md-4 wow fadeInUp" data-wow-delay="200ms">
                          <div className="footer-widget__column footer-widget__links clearfix">
                            <h3 className="footer-widget__title">Links</h3>
                            <ul className="footer-widget__links-list list-unstyled clearfix">
                              <li>
                                <a href="/terms">Privacy Policy</a>
                              </li>
                              <li>
                                <a href="/terms">Terms Of Service</a>
                              </li>
                              <li>
                                <a href="/contact">Contact Us</a>
                              </li>
                            </ul>
                          </div>
                        </div>
                        <div className="col-xl-6 col-lg-6 col-md-4 wow fadeInUp" data-wow-delay="300ms">
                          <div className="footer-widget__column footer-widget__contact clearfix">
                            <h3 className="footer-widget__title">Contact</h3>
                            <p className="footer-widget__contact-text">{SITE.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="site-footer__top-contact-details wow fadeInUp" data-wow-delay="400ms">
                      <div className="site-footer__top-right-social"></div>
                      <div className="site-footer__top-right-phone">
                        <p className="site-footer__top-right-phone-tagline">Call Anytime</p>
                        <a href="#">
                          <i className="fa fa-phone-alt"></i> {SITE.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="site-footer__bottom">
              <p className="site-footer__bottom-text">
                &copy; 2025 Copyrights all right reserved. <a href="/">{SITE.name}</a>
              </p>
            </div>
          </div>
        </footer>
      </div>

      <div className="mobile-nav__wrapper">
        <div className="mobile-nav__overlay mobile-nav__toggler"></div>
        <div className="mobile-nav__content">
          <span className="mobile-nav__close mobile-nav__toggler">
            <i className="fa fa-times"></i>
          </span>
          <div className="logo-box">
            <a href="/" aria-label="logo image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="logo" src="/assets/logo.svg" width="155" alt={SITE.name} />
            </a>
          </div>
          <div className="mobile-nav__container"></div>
          <ul className="mobile-nav__contact list-unstyled">
            <li>
              <i className="fa fa-envelope"></i>
            </li>
            <li>
              <i className="fa fa-phone-alt"></i>
              <a href="#">{SITE.phone}</a>
            </li>
          </ul>
        </div>
      </div>

      <a href="#" data-target="html" className="scroll-to-target scroll-to-top">
        <i className="fa fa-angle-up"></i>
      </a>

      {/* The theme's vendor scripts are loaded by <LandingBoot />, not here.
          Rendered as markup they run during HTML parsing — before React
          hydrates — and their initialisers then rewrite DOM React owns
          (odometer adds `odometer-auto-theme`, WOW adds `animated`), which
          React reports as a hydration mismatch error. */}

      <LandingBoot />
    </>
  );
}

/** The breadcrumb banner that opens every inner page. */
export function PageHeader({ title, crumb }) {
  return (
    <section className="page-header">
      <div
        className="page-header-bg"
        style={{ backgroundImage: 'url(/theme/images/page-header-bg.jpg)' }}
      ></div>
      <div className="container">
        <div className="page-header__inner">
          <h2>{title}</h2>
          <ul className="thm-breadcrumb list-unstyled">
            <li>
              <a href="/">Home</a>
            </li>
            <li className="active">{crumb}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
