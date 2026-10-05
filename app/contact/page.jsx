import LandingShell, { PageHeader } from '@/components/LandingShell';
import { SITE } from '@/lib/plans';
import ContactForm from '@/components/ContactForm';

export const metadata = {
  title: `Contact us || ${SITE.name}`,
};

/**
 * Port of the Archive 2 `home/contact.blade.php` page. The form posts to
 * /api/contact, which emails the support inbox (CONTACT_EMAIL).
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
                          <ContactForm supportEmail={SITE.email} />
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
