import LandingShell, { PageHeader } from '@/components/LandingShell';
import { SITE } from '@/lib/plans';

export const metadata = {
  title: `About Us || ${SITE.name}`,
};

/** Port of the Archive 2 `home/about.blade.php` page. */
export default function AboutPage() {
  return (
    <LandingShell>
      <PageHeader title="About us" crumb="About" />

      <section className="get-to-know">
        <div className="container">
          <div className="row">
            <div className="col-xl-5">
              <div className="get-to-know__left">
                <div className="section-title text-left">
                  <h2 className="section-title__title">Professional investment services.</h2>
                </div>
                <p className="get-to-know__text">
                  At our core, we believe in building meaningful, long-term partnerships with our
                  clients. We work hand in hand with every client, ensuring not only value creation
                  but also knowledge transfer that empowers growth and sustainability. Our goal is
                  not just to deliver services, but to become a trusted extension of your
                  team—collaborating with you every step of the way to help turn your vision into
                  reality.
                </p>
                <p className="get-to-know__text">
                  Our work philosophy is deeply rooted in transparency, dedication, and a strong work
                  ethic. We take pride in our in-depth understanding of the industries we serve and
                  bring this knowledge to every project we undertake. With a passionate commitment to
                  meeting shared goals and ambitions, we focus on outcomes that truly matter.
                </p>
                <p className="get-to-know__text">
                  We believe that success is built on trust, collaboration, and a relentless pursuit
                  of excellence. That&apos;s why we go beyond expectations, ensuring that every
                  solution we deliver creates lasting impact. Our strategy is to identify and invest
                  in high-potential opportunities that align with our values and those of our
                  clients—businesses that are not only poised for growth but also offer outstanding
                  returns.
                </p>
                <p className="get-to-know__text">
                  Ultimately, we are driven by purpose and powered by people. Whether you&apos;re
                  just starting out or scaling to new heights, we are here to support your journey
                  with insight, innovation, and integrity.
                </p>
              </div>
            </div>
            <div className="col-xl-7">
              <div className="get-to-know__right">
                <ul className="get-to-know__images list-unstyled">
                  <li>
                    <div className="get-to-know__img-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/theme/images/vev_about.jpg" alt="" />
                    </div>
                  </li>
                  <li>
                    <div className="get-to-know__img-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/theme/images/vev_about2.jpg" alt="" />
                    </div>
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
