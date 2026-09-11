import LandingShell, { PageHeader } from '@/components/LandingShell';
import { SITE } from '@/lib/plans';

export const metadata = {
  title: `Terms & Conditions || ${SITE.name}`,
};

const N = SITE.name;

const SECTIONS = [
  {
    heading: 'Definitions',
    body: [
      `"${N}", "we" and "our" means ${N} Limited, a private limited company registered at Rayne Building, Fitzrovia, London, WC1E 6JF, United Kingdom.`,
      `"group" means ${N} and its subsidiaries as defined in section 1159 of the UK Companies Act 2006`,
      '"Material" means the contents of the Site, including, but not limited to, text, graphics, logos, links, codes and data.',
    ],
  },
  {
    heading: 'Accessing the Site',
    body: [
      `${N} will endeavour to ensure that the Site is accessible for 24 hours a day but will not be liable if‚ for any reason‚ the Site is unavailable for any time or for any period. ${N} will have the right to suspend access to or withdraw or restrict access to some parts this website temporarily or permanently and without notice.`,
      `${N} will not be liable for any loss or damage arising in contract‚ tort or otherwise if the Site is unavailable or suspended for any reason.`,
      'You are responsible for making all arrangements necessary for you to have access to the Site. You are also responsible for ensuring that all persons who access the Site through your internet connection are aware of these terms, and that they comply with them.',
    ],
  },
  {
    heading: 'What you are allowed to do',
    body: [
      'You may only use the Site for personal use and when accessing the Site must comply with the provisions of these Terms and Conditions and any other policies that are on the Site and/or which apply to the use of particular parts of the Site and/or products and services which are available from time-to-time.',
      'You may print a copy of any page of the Site, for your own personal purposes, provided you do not do any of the things set out under "What you are not allowed to do" and provided always that our status (and that of any identified contributors) as the authors of material on the Site must always be acknowledged.',
      'You must only use the Site and anything available from the Site for lawful purposes, and you must comply with all applicable laws, statutes and regulations.',
    ],
  },
  {
    heading: 'What you are not allowed to do',
    body: ['Except to the extent expressly set out in these terms, you are not allowed to:'],
    list: [
      'make any copies of any part of the Site; or',
      'remove or change anything on the Site; or',
      'remove or change any copyright, trade mark or other intellectual property right notices contained in the original material or that printed off from the Site; or',
      'modify the paper or digital copies of any materials you have printed off or downloaded in any way, and you must not use any illustrations, photographs, video or audio sequences or any graphics separately from any accompanying text; or use any part of the materials on the Site for commercial purposes without obtaining a licence to do so from us or our licensors.',
    ],
    after: [
      'If you print off, copy or download any part of the Site in breach of these terms of use, your right to use the Site will cease immediately and you must, at our option, return or destroy any copies of the materials you have made.',
    ],
  },
  {
    heading: 'Intellectual Property Rights',
    body: [
      `All intellectual property rights in the Site and in any material published on it (including but not limited to text, video, photographs and other images and sound, trademarks and logos) contained in the Site are owned by ${N}, members of its group or their respective licensors. Those works are protected by copyright laws and treaties around the world. All such rights are reserved.`,
    ],
  },
  {
    heading: 'Information',
    body: [
      `The information contained on the Site is provided for information purposes only and ${N} will use reasonable care and skill to ensure that it is accurate at the date of publication. However‚ because of the nature of the Internet‚ there may be circumstances in which errors occur within the information. Consequently, ${N} makes no warranty or guarantee as to the accuracy of any information on the Site and cannot accept liability for any errors or omissions within it.`,
    ],
  },
  {
    heading: 'Reliance on Information Posted',
    body: [
      'Commentary and other materials posted on the Site are not intended to amount to advice on which reliance should be placed. We therefore accept no liability or responsibility arising from any reliance placed on such materials by any visitor to the Site, or by any third party who may be informed of any of its contents.',
      `Unless otherwise stated, all statistics are inclusive of ${N}'s subsidiaries and associated companies.`,
    ],
  },
  {
    heading: 'Changes to the Site',
    body: [
      `${N} may change the format and content of the Site from time to time. You should refresh your browser each time you visit the Site to ensure that you download the most up to date version of the Site. Any of the material on the Site may be out of date at any given time, and we are under no obligation to update such material.`,
    ],
  },
  {
    heading: 'Limitation of Liability',
    body: [
      'The material displayed on the Site is provided without any guarantees, conditions or warranties as to its accuracy. To the extent permitted by law, we, other members of our group and third parties connected to us hereby expressly exclude: All conditions, warranties and other terms which might otherwise be implied by statute, common law or the law of equity. Any liability for any direct, indirect, special or consequential loss or damage incurred by any user in connection with the Site or in connection with the use, inability to use, or results of the use of the Site, any websites linked to it and any materials posted on it',
    ],
  },
  {
    heading: 'Linking to the Site',
    body: [
      'You may link to our home page, provided you do so in a way that is fair and legal and does not damage our reputation or take advantage of it, but you must not establish a link in such a way as to suggest any form of association, approval or endorsement on our part where none exists.',
      'You must not establish a link from any website that is not owned by you.',
      'The Site must not be framed on any other site, nor may you create a link to any part of the Site other than the home page. We reserve the right to withdraw linking permission without notice.',
      `If you wish to make any use of material on the Site other than that set out above, please address your request to ${SITE.email}.`,
    ],
  },
  {
    heading: 'External Links',
    body: [
      `The Site may from time to time include links to external sites, resources and co-branded pages. ${N} has included links to these sites, resources and co-branded pages to provide you with access to information and services that you may find useful or interesting. ${N} is not responsible for the content of these sites, resources and pages or for anything provided by them and accepts no responsibility for them or for any loss or damage that may arise from your use of them. You should read carefully and agree with the terms and conditions of third party websites before using them.`,
    ],
  },
  {
    heading: 'Viruses, hacking and other offences',
    body: [
      'You must not misuse the Site by knowingly introducing viruses, trojans, worms, logic bombs or other material which is malicious or technologically harmful. You must not attempt to gain unauthorised access to the Site, the server on which the Site is stored or any server, computer or database connected to the Site. You must not attack the Site via a denial-of-service attack or a distributed denial-of service attack.',
      'By breaching this provision, you would commit a criminal offence under the Computer Misuse Act 1990. We will report any such breach to the relevant law enforcement authorities and we will co-operate with those authorities by disclosing your identity to them. In the event of such a breach, your right to use the Site will cease immediately.',
      'We will not be liable for any loss or damage caused by a distributed denial-of-service attack, viruses or other technologically harmful material that may infect your computer equipment, computer programs, data or other proprietary material due to your use of the Site or to your downloading of any material posted on it, or on any website linked to it. You must ensure that your computer has all necessary software to protect you from computer viruses.',
    ],
  },
  {
    heading: 'Suspension and termination of service',
    body: [
      `${N} may suspend or terminate the operation of the Site at any time. Access to or use of the Site or any pages linked to it will not necessarily be uninterrupted or error free.`,
    ],
  },
  {
    heading: 'Personal data and Data Protection',
    body: [
      `${N} will take all reasonable steps to ensure that any information you provide via e-mail and / or via the Site is kept secure‚ but please remember that‚ because of the nature of the Internet‚ the security of emails cannot be guaranteed. Consequently, your privacy of your data in such email correspondence cannot be guaranteed. There is no guarantee that any emails that you send to us will be received by us.`,
      'We process information about you in accordance with our privacy policy. By using the Site, you consent to such processing and you warrant that all data provided by you is accurate.',
    ],
  },
  {
    heading: 'General',
    body: [
      `${N} may change these Terms and Conditions from time to time and will endeavour to notify you of any major changes by posting a message on the Site. You should check these Terms and Conditions each time you revisit the Site. These Terms and Conditions form the entire understanding of the parties and supersede all previous agreements, understandings and representations relating to the subject matter. If any provision of these Terms and Conditions is found to be unenforceable, this shall not affect the validity of any other provision. ${N} may delay enforcing its rights under these Terms and Conditions without losing them. ${N} will not be liable to you for any breach of these Terms and Conditions which arises because of any circumstances which ${N} cannot reasonably be expected to control. You agree that ${N} may sub-contract the performance of any of its obligations.`,
    ],
  },
];

/** Port of the Archive 2 `home/terms.blade.php` page. */
export default function TermsPage() {
  return (
    <LandingShell>
      <PageHeader title="Terms" crumb="Terms & Conditions" />

      <section className="get-to-know">
        <div className="container">
          <div className="row">
            <div className="col-xl-12">
              <div className="get-to-know__left">
                <div className="section-title text-left">
                  <h2 className="section-title__title">Terms And Conditions</h2>
                </div>

                <p className="get-to-know__text">
                  PLEASE READ THESE TERMS AND CONDITIONS (TERMS) BEFORE USING THE SERVICES (AS
                  DEFINED BELOW). THEY ARE THE RULES AND REQUIREMENTS THAT APPLY TO THE SERVICES. DO
                  NOT MAKE A DEPOSIT, REGISTER FOR AN ACCOUNT (AS DEFINED BELOW), OR USE THE SERVICES
                  IF YOU ARE NOT IN AGREEMENT WITH THESE TERMS.
                </p>

                <div className="section-info">
                  {SECTIONS.map((s) => (
                    <div className="terms-section" key={s.heading}>
                      <h3>{s.heading}</h3>
                      {s.body.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                      {s.list && (
                        <ul>
                          {s.list.map((li, i) => (
                            <li key={i}>{li}</li>
                          ))}
                        </ul>
                      )}
                      {s.after && s.after.map((p, i) => <p key={i}>{p}</p>)}
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
