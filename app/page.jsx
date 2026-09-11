import LandingShell from '@/components/LandingShell';
import { PLANS, SITE, BRANDS } from '@/lib/plans';

export const metadata = {
  title: `${SITE.name} || Investment solutions designed with elegance and finesse`,
  description:
    'Online Investment, Cryptocurrencies, Crypto Investment, Deposit, Investment, Earn profit',
};

/**
 * Public landing page — a direct port of the Archive 2 `home/index.blade.php`
 * layout (the Conult theme). The markup is intentionally kept in the theme's
 * own class vocabulary: LandingShell loads the theme stylesheet, which does
 * all the styling, the same way it does in the original Laravel app.
 */

const SLIDES = [
  {
    image: '/theme/images/vev_slider.jpg',
    title: (
      <>
        Dedicated to <br />
        building professional relationships
      </>
    ),
    text:
      'We are a reputable, professional investment firm committed to operating reliably, ' +
      'independently, transparently and sustainably at all times.',
    cta: { href: '/login', label: 'Invest Now' },
  },
  {
    image: '/theme/images/vev_slider2.jpg',
    title: (
      <>
        Not only reliable, <br /> also result-oriented
      </>
    ),
    text:
      'We strive to simplify our investment process so you have less stress and worry. ' +
      'We manage, administer and control our members investments on a day-to-day basis.',
    cta: { href: '/register', label: 'Join Us' },
  },
  {
    image: '/theme/images/vev_slider3.jpg',
    title: (
      <>
        Tailor-made <br /> Investment Solutions
      </>
    ),
    text:
      'We provide high returns on investment, Your satisfaction matters to us. ' +
      'That is why we go the extra mile for you.',
    cta: { href: '/login', label: 'Invest Now' },
  },
];

const SWIPER_OPTIONS = JSON.stringify({
  slidesPerView: 1,
  loop: true,
  effect: 'fade',
  pagination: { el: '#main-slider-pagination', type: 'bullets', clickable: true },
  navigation: {
    nextEl: '#main-slider__swiper-button-next',
    prevEl: '#main-slider__swiper-button-prev',
  },
  autoplay: { delay: 5000 },
});

export default function LandingPage() {
  return (
    <LandingShell variant="three">
      {/* Main Slider */}
      <section className="main-slider main-slider-three">
        <div className="swiper-container thm-swiper__slider" data-swiper-options={SWIPER_OPTIONS}>
          <div className="swiper-wrapper">
            {SLIDES.map((slide, i) => (
              <div className="swiper-slide" key={i}>
                <div className="image-layer" style={{ backgroundImage: `url(${slide.image})` }}></div>
                <div className="main-slider-three-shape">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/theme/images/shapes/main-slider-three-shape.png" alt="" />
                </div>
                <div className="container">
                  <div className="row">
                    <div className="col-xl-7">
                      <div className="main-slider__content">
                        <h2>{slide.title}</h2>
                        <p>{slide.text}</p>
                        <div className="main-slider-three__bottom">
                          <a href={slide.cta.href} className="thm-btn main-slider-three__btn">
                            {slide.cta.label}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="main-slider__nav">
            <div className="swiper-button-prev" id="main-slider__swiper-button-next">
              <i className="icon-right-arrow icon-left-arrow"></i>
            </div>
            <div className="swiper-button-next" id="main-slider__swiper-button-prev">
              <i className="icon-right-arrow"></i>
            </div>
          </div>
        </div>
      </section>

      {/* Real World */}
      <section className="real-world">
        <div className="container">
          <div className="row">
            <div className="col-xl-4">
              <div className="real-world__left">
                <div className="section-title text-left">
                  <span className="section-title__tagline">Investing in a better future</span>
                  <h2 className="section-title__title">We offer strong financial returns</h2>
                </div>
                <p className="real-world__left-text">
                  We maximise the social and financial impact of every investment we make by
                  focussing on innovative companies.
                </p>
                <p>
                  We offer exceptional financial guidance tailored to international investors&apos;
                  unique needs, working collaboratively with you, listening to your needs and
                  aspirations.
                </p>
              </div>
            </div>
            <div className="col-xl-4">
              <div className="real-world__middle">
                <div className="real-world__img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/theme/images/vev_home.jpg" alt="" />
                </div>
              </div>
            </div>
            <div className="col-xl-4">
              <div className="real-world__counter-box">
                <ul className="list-unstyled real-world__counter">
                  {PLANS.map((plan) => (
                    <li className="real-world__counter-single" key={plan.id}>
                      <div className="real-world__counter-content">
                        <h4 className="real-world__counter-title">{plan.name}</h4>
                        <span className="odometer" data-count={plan.percent.toFixed(1)}>
                          0
                        </span>
                        <span className="cent">%</span>
                        <p className="real-world__counter-text">{plan.note}</p>
                      </div>
                      <div className="real-world__counter-icon">
                        <span className={plan.id % 2 === 0 ? 'icon-help' : 'icon-customer-review'}></span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* We Improve */}
      <section className="we-improve clearfix">
        <div
          className="we-improve-bg"
          style={{ backgroundImage: 'url(/theme/images/vev_home_bg.jpg)' }}
        ></div>
        <div className="container">
          <div className="we-improve__inner">
            <div className="section-title text-left">
              <span className="section-title__tagline">Investing for impact &amp; return.</span>
              <h2 className="section-title__title">
                Truly independent investment solution for new and expat investors
              </h2>
            </div>
            <p className="we-improve__text">
              We offer our investors the comfort to invest with us with huge profit expectation.
              Our investment process is guided by a comprehensive set of policies and position
              statements, We have been able to time the market very well and the team has proved to
              be good at asset selection for our clients.
            </p>
            <div className="we-improve__funded">
              <div className="we-improve__funded-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/theme/images/vev_home_img.jpg" alt="" />
              </div>
              <p className="we-improve__funded-content">
                At {SITE.name}, you can find an investment plan to suit every <span>need.</span>
              </p>
            </div>
            <ul className="list-unstyled we-improve__points">
              <li>
                <div className="icon">
                  <i className="fa fa-check"></i>
                </div>
                <div className="text">
                  <p>
                    <a href="/login">Account login</a>
                  </p>
                </div>
              </li>
              <li>
                <div className="icon">
                  <i className="fa fa-check"></i>
                </div>
                <div className="text">
                  <p>
                    <a href="/register">Create new account</a>
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contact One */}
      <section className="contact-one">
        <div className="container">
          <div className="row">
            <div className="col-xl-6 col-lg-6">
              <div className="contact-one__left">
                <div className="section-title text-left">
                  <span className="section-title__tagline">
                    Provider of specialist investment capabilities
                  </span>
                  <h2 className="section-title__title">
                    Investing can be a great way to help grow your money.
                  </h2>
                </div>
                <p className="contact-one__text">
                  All our investment teams - whether in-house or individually branded - operate with
                  discrete investment autonomy, according to their investment philosophies. Active
                  investor retention and development by our team focussing on high quality
                  investors.
                </p>
                <h2 className="contact-one__founder">
                  James M. Batista<span>- Co Founder</span>
                </h2>
              </div>
            </div>
            <div className="col-xl-6 col-lg-6">
              <div className="contact-one__right">
                <div className="contact-one__form-box">
                  {BRANDS.map((row, i) => (
                    <div className="row" key={i}>
                      {row.map((brand) => (
                        <div className="col-md-4 text-center" key={brand}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className="processor"
                            src={`/theme/images/brand/${brand}.png`}
                            alt={brand}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
