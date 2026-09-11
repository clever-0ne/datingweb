import LandingShell, { PageHeader } from '@/components/LandingShell';
import { SITE } from '@/lib/plans';

export const metadata = {
  title: `Contact us || ${SITE.name}`,
};

/**
 * Port of the Archive 2 `home/contact.blade.php` page. The original posted to
 * a `enquiry` route and emailed the message; there is no mail transport wired
 * up here, so the form is presentational — see the note under the submit
 * button. Wire it to a real endpoint before the site takes live enquiries.
 */
export default function ContactPage() {
  return (
    <LandingShell>
      <PageHeader title="Contact us" crumb="Contact" />

      <section className="contact-page-details">
        <div className="container">
          <div className="row">
            <div className="col-xl-8 col-lg-7">
              <div className="contact-page-details__left">
                <div className="contact-page">
                  <div className="container">
                    <div className="section-title text-center">
                      <span className="section-title__tagline">Contact with us</span>
                      <h2 className="section-title__title">Drop us a Message</h2>
                    </div>
                    <div className="row">
                      <div className="col-xl-12">
                        <div className="contact-page__form">
                          <form className="comment-one__form" id="contactForm">
                            <div className="row">
                              <div className="col-xl-6">
                                <div className="comment-form__input-box">
                                  <input type="text" placeholder="Your Name" name="name" />
                                </div>
                              </div>
                              <div className="col-xl-6">
                                <div className="comment-form__input-box">
                                  <input type="email" placeholder="Email Address" name="email" />
                                </div>
                              </div>
                              <div className="col-xl-6">
                                <div className="comment-form__input-box">
                                  <input type="text" placeholder="Phone Number" name="phone" />
                                </div>
                              </div>
                              <div className="col-xl-6">
                                <div className="comment-form__input-box">
                                  <input type="text" placeholder="Subject" name="subject" />
                                </div>
                              </div>
                              <div className="col-xl-12">
                                <div className="comment-form__input-box">
                                  <textarea name="message" placeholder="Write a Message"></textarea>
                                </div>
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-xl-12 text-left">
                                <button type="submit" className="thm-btn comment-form__btn">
                                  send a message
                                </button>
                                <p style={{ marginTop: 15 }}>
                                  Or email us directly at{' '}
                                  <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
                                </p>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-5">
              <div className="contact-page-details__right">
                <ul className="list-unstyled contact-page-details__list">
                  <li>
                    <span>Call Anytime</span>
                    <p>
                      <a href="#">{SITE.phone}</a>
                    </p>
                  </li>
                  <li>
                    <span>Send Email</span>
                    <p>
                      <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                    </p>
                  </li>
                  <li>
                    <span>Visit Office</span>
                    <p>{SITE.address}</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
